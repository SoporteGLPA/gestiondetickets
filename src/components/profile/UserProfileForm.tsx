
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function UserProfileForm({ profile }: { profile: any }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [email] = useState(profile.email ?? "");
  const [updating, setUpdating] = useState(false);
  const [password, setPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const { error } = await supabase.from("profiles").update({
      first_name: firstName,
      last_name: lastName,
    }).eq("id", profile.id);
    setUpdating(false);

    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo actualizar el perfil",
      });
    } else {
      toast({ title: "Guardado", description: "Perfil actualizado" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPass(true);
    const { error } = await supabase.auth.updateUser({ password });
    setChangingPass(false);
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: error.message,
      });
    } else {
      toast({ title: "Contraseña cambiada", description: "Contraseña actualizada correctamente" });
      setPassword("");
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div>
        <Label>Nombre</Label>
        <Input value={firstName} onChange={e => setFirstName(e.target.value)} style={{ borderColor: "#000" }} />
      </div>
      <div>
        <Label>Apellido</Label>
        <Input value={lastName} onChange={e => setLastName(e.target.value)} style={{ borderColor: "#000" }} />
      </div>
      <div>
        <Label>Correo electrónico</Label>
        <Input value={email} disabled style={{ borderColor: "#000", background: "#f4f4f4" }} />
      </div>
      <Button type="submit" style={{ backgroundColor: "#047857", borderColor: "#000" }} disabled={updating}>
        Guardar cambios
      </Button>

      {/* Cambiar contraseña */}
      <form onSubmit={handleChangePassword} className="space-y-2 mt-6 bg-gray-50 p-4 rounded">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          placeholder="Cambiar contraseña"
          onChange={e => setPassword(e.target.value)}
          style={{ borderColor: "#000" }}
          disabled={changingPass}
        />
        <Button type="submit" style={{ backgroundColor: "#047857", borderColor: "#000" }} disabled={changingPass || !password}>
          Cambiar contraseña
        </Button>
      </form>
    </form>
  );
}
