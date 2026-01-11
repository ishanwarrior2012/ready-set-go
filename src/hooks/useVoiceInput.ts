import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Determine best supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      logger.info("Voice recording started", { mimeType });
    } catch (error) {
      logger.error("Failed to start recording:", error);
      options.onError?.("Could not access microphone. Please check permissions.");
      throw error;
    }
  }, [options]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        try {
          // Create blob from recorded chunks
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          
          if (audioBlob.size < 1000) {
            logger.warn("Recording too short");
            options.onError?.("Recording was too short. Please try again.");
            resolve(null);
            return;
          }

          logger.info("Processing audio", { size: audioBlob.size, mimeType });

          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              
              // Send to edge function for transcription
              const { data, error } = await supabase.functions.invoke('voice-transcribe', {
                body: { 
                  audio: base64Audio,
                  mimeType: mimeType.split(';')[0] // Remove codec info
                }
              });

              if (error) {
                logger.error("Transcription error:", error);
                options.onError?.("Failed to transcribe audio. Please try again.");
                resolve(null);
                return;
              }

              if (data?.text) {
                logger.info("Transcription successful:", data.text);
                options.onTranscript?.(data.text);
                resolve(data.text);
              } else {
                options.onError?.("No speech detected. Please try again.");
                resolve(null);
              }
            } catch (err) {
              logger.error("Processing error:", err);
              options.onError?.("Failed to process audio. Please try again.");
              resolve(null);
            } finally {
              setIsProcessing(false);
              cleanupRecording();
            }
          };

          reader.onerror = () => {
            logger.error("FileReader error");
            options.onError?.("Failed to read audio data.");
            setIsProcessing(false);
            cleanupRecording();
            resolve(null);
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          logger.error("Stop recording error:", error);
          options.onError?.("An error occurred. Please try again.");
          setIsProcessing(false);
          cleanupRecording();
          resolve(null);
        }
      };

      mediaRecorder.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    });
  }, [isRecording, options, cleanupRecording]);

  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    setIsProcessing(false);
    cleanupRecording();
    logger.info("Recording cancelled");
  }, [cleanupRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
