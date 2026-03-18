import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Camera, Upload, Heart, Download, Eye, Shield, Save, X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  studentId?: string;
  career?: string;
  mfaEnabled: boolean;
}

export default function Profile() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    studentId: "",
    career: "",
    avatarUrl: "",
    bannerUrl: "",
  });

  // Fetch current user
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("No autenticado");
      return res.json();
    },
    retry: false,
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        studentId: user.studentId || "",
        career: user.career || "",
        avatarUrl: user.avatarUrl || "",
        bannerUrl: user.bannerUrl || "",
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (userError) {
      navigate("/login");
    }
  }, [userError, navigate]);

  // Upload to S3 with presigned URL
  const uploadImageToS3 = async (file: File, type: "avatar" | "banner") => {
    try {
      const type_param = type === "avatar" ? "profile_avatar" : "profile_banner";

      // Generate presigned URL
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          filename: file.name,
          mimetype: file.type,
          type: type_param,
        }),
      });

      if (!presignRes.ok) {
        throw new Error("Error generando URL de subida");
      }

      const { presignedUrl, s3Url } = await presignRes.json();

      // Upload to S3
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Error subiendo imagen a S3");
      }

      return s3Url;
    } catch (error) {
      console.error("[Profile] Error uploading to S3:", error);
      throw error;
    }
  };

  // Handle avatar file selection
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploadingAvatar(true);
    try {
      const url = await uploadImageToS3(file, "avatar");
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      setSuccessMessage("Avatar subido correctamente");
    } catch (error) {
      setErrorMessage("Error subiendo avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle banner file selection
  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploadingBanner(true);
    try {
      const url = await uploadImageToS3(file, "banner");
      setFormData(prev => ({ ...prev, bannerUrl: url }));
      setSuccessMessage("Banner subido correctamente");
    } catch (error) {
      setErrorMessage("Error subiendo banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error actualizando perfil");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data.user);
      setEditMode(false);
      setSuccessMessage("Perfil actualizado exitosamente");
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Skeleton className="w-full h-48" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      {/* Banner with Avatar */}
      <div className="relative h-48 bg-gradient-to-r from-primary/20 to-secondary/20 overflow-hidden">
        {/* Banner Image */}
        {formData.bannerUrl || bannerPreview ? (
          <img
            src={bannerPreview || formData.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary opacity-50" />
        )}

        {/* Edit Banner Button */}
        {editMode && (
          <label className="absolute top-4 right-4 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              ref={bannerInputRef}
              onChange={handleBannerSelect}
              className="hidden"
              disabled={uploadingBanner}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploadingBanner}
              onClick={(e) => {
                e.preventDefault();
                bannerInputRef.current?.click();
              }}
              className="gap-2"
            >
              {uploadingBanner ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Banner
                </>
              )}
            </Button>
          </label>
        )}

        {/* Avatar */}
        <div className="absolute -bottom-12 left-8">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage src={avatarPreview || formData.avatarUrl} />
              <AvatarFallback className="bg-primary text-white text-3xl">
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>

            {/* Edit Avatar Button */}
            {editMode && (
              <label className="absolute bottom-0 right-0 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  ref={avatarInputRef}
                  onChange={handleAvatarSelect}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={uploadingAvatar}
                  onClick={(e) => {
                    e.preventDefault();
                    avatarInputRef.current?.click();
                  }}
                  className="gap-1 rounded-full p-2 h-10 w-10"
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Profile Info Card */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl">
                {formData.firstName} {formData.lastName}
              </CardTitle>
              <CardDescription>@{user.username}</CardDescription>
            </div>

            <Button
              variant={editMode ? "destructive" : "default"}
              onClick={() => {
                if (editMode) {
                  // Revert changes
                  setFormData({
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    bio: user.bio || "",
                    studentId: user.studentId || "",
                    career: user.career || "",
                    avatarUrl: user.avatarUrl || "",
                    bannerUrl: user.bannerUrl || "",
                  });
                  setAvatarPreview(null);
                  setBannerPreview(null);
                }
                setEditMode(!editMode);
              }}
              className="gap-2"
            >
              {editMode ? (
                <>
                  <X className="w-4 h-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Editar perfil
                </>
              )}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Edit Form */}
            {editMode ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate(formData);
                }}
                className="space-y-6"
              >
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Descripción</Label>
                  <Textarea
                    id="bio"
                    placeholder="Cuéntales algo sobre ti..."
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    className="resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500">
                    {formData.bio.length}/500 caracteres
                  </p>
                </div>

                {/* Academic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Matrícula/ID Estudiante</Label>
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          studentId: e.target.value,
                        }))
                      }
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="career">Carrera</Label>
                    <Input
                      id="career"
                      value={formData.career}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          career: e.target.value,
                        }))
                      }
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  type="submit"
                  className="w-full gap-2 bg-primary hover:bg-primary/90"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </form>
            ) : (
              // View Mode
              <div className="space-y-6">
                {/* Email */}
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="text-lg text-gray-900">{user.email}</p>
                </div>

                {/* Bio */}
                {formData.bio && (
                  <div>
                    <Label className="text-gray-600">Descripción</Label>
                    <p className="text-lg text-gray-900">{formData.bio}</p>
                  </div>
                )}

                {/* Student ID & Career */}
                {(formData.studentId || formData.career) && (
                  <div className="grid grid-cols-2 gap-4">
                    {formData.studentId && (
                      <div>
                        <Label className="text-gray-600">Matrícula</Label>
                        <p className="text-lg text-gray-900">{formData.studentId}</p>
                      </div>
                    )}
                    {formData.career && (
                      <div>
                        <Label className="text-gray-600">Carrera</Label>
                        <p className="text-lg text-gray-900">{formData.career}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Autenticación MFA</span>
                {user.mfaEnabled ? (
                  <Badge variant="default" className="bg-green-600">
                    Activo
                  </Badge>
                ) : (
                  <Badge variant="outline">Inactivo</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
