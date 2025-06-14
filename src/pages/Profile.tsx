
import { UserProfileForm } from "@/components/profile/UserProfileForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Mi Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <UserProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
