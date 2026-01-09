import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Edit,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default function Profile() {
  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-heading text-xl font-bold">John Doe</h1>
              <p className="text-muted-foreground">john.doe@example.com</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Edit className="h-4 w-4 mr-1" />
                Edit Profile
              </Button>
            </div>
          </div>
        </Card>

        {/* Profile Info */}
        <Card className="divide-y">
          <div className="flex items-center gap-3 p-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">John Doe</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">john.doe@example.com</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 p-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">San Francisco, CA</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-medium">January 2025</p>
            </div>
          </div>
        </Card>

        {/* Sign Out */}
        <Button variant="outline" className="w-full" size="lg">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </Layout>
  );
}
