import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { BookOpen, Eye, EyeOff, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Mínimo 3 caracteres").max(30, "Máximo 30 caracteres"),
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string(),
  studentId: z.string().optional(),
  career: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      studentId: "",
      career: "",
    },
  });

  const password = form.watch("password");
  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const { data: careers = [] } = useQuery({
    queryKey: ["careers"],
    queryFn: async () => {
      const res = await fetch("/api/careers");
      return res.json();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setTimeout(() => navigate("/login"), 2000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = (data: RegisterForm) => {
    setError(null);
    registerMutation.mutate(data);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            ¡Cuenta creada exitosamente!
          </h2>
          <p className="text-gray-600">Redirigiendo al inicio de sesión...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border border-gray-200 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src="/logo_upy.png" alt="UPY" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Crear cuenta
            </CardTitle>
            <CardDescription className="text-gray-500">
              Únete a la comunidad BiblioUPY
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    {...form.register("firstName")}
                    className={form.formState.errors.firstName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    placeholder="Pérez"
                    {...form.register("lastName")}
                    className={form.formState.errors.lastName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@upy.edu.mx"
                  {...form.register("email")}
                  className={form.formState.errors.email ? "border-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  placeholder="juanperez"
                  {...form.register("username")}
                  className={form.formState.errors.username ? "border-red-500" : ""}
                />
                {form.formState.errors.username && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Matrícula (opcional)</Label>
                  <Input
                    id="studentId"
                    placeholder="123456"
                    {...form.register("studentId")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="career">Carrera (opcional)</Label>
                  <Select onValueChange={(value) => form.setValue("career", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {careers.map((career: any) => (
                        <SelectItem key={career.id} value={career.code}>
                          {career.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...form.register("password")}
                    className={form.formState.errors.password ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password strength indicator */}
                <div className="text-xs space-y-1 mt-2">
                  {[
                    { key: "length", text: "Al menos 8 caracteres" },
                    { key: "uppercase", text: "Una letra mayúscula" },
                    { key: "lowercase", text: "Una letra minúscula" },
                    { key: "number", text: "Un número" },
                    { key: "special", text: "Un carácter especial (!@#$%)" },
                  ].map(({ key, text }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-1 ${
                        passwordStrength[key as keyof typeof passwordStrength]
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <Check
                        size={12}
                        className={
                          passwordStrength[key as keyof typeof passwordStrength]
                            ? "opacity-100"
                            : "opacity-30"
                        }
                      />
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...form.register("confirmPassword")}
                    className={
                      form.formState.errors.confirmPassword ? "border-red-500" : ""
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus size={20} />
                    Crear cuenta
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">o regístrate con</span>
                </div>
              </div>
              <a
                href="/api/auth/google"
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.27498 6.60986C0.46498 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46498 15.7699 1.28498 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
                </svg>
                Registrarse con Google
              </a>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          © {new Date().getFullYear()} BiblioUPY - Universidad Politécnica de Yucatán
        </p>
      </motion.div>
    </div>
  );
}
