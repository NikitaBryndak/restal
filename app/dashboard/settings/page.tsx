"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderOne } from "@/components/ui/loader";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
    Settings,
    Bell,
    Lock,
    Palette,
    Globe,
    Shield,
    ChevronRight,
    Moon,
    Sun,
    Smartphone,
    Mail,
    Check,
    Eye,
    EyeOff,
    AlertCircle
} from "lucide-react";

export default function SettingsPage() {
    const { userProfile, loading, error, refetch } = useUserProfile();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [passwordChangeError, setPasswordChangeError] = useState("");
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState(userProfile?.userName || "");
    const [usernameChangeLoading, setUsernameChangeLoading] = useState(false);
    const [usernameChangeError, setUsernameChangeError] = useState("");
    const [usernameChangeSuccess, setUsernameChangeSuccess] = useState("");
    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        push: false,
        marketing: false
    });
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
    const [language, setLanguage] = useState('uk');

    // Sync newUsername when userProfile updates
    useEffect(() => {
        if (userProfile?.userName && !isEditingUsername) {
            setNewUsername(userProfile.userName);
        }
    }, [userProfile?.userName, isEditingUsername]);

    const handleChangePassword = async () => {
        // Reset previous messages
        setPasswordChangeError("");
        setPasswordChangeSuccess("");

        // Validation
        if (!currentPassword || !newPassword) {
            setPasswordChangeError("Please fill in all password fields");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordChangeError("New password must be at least 8 characters");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordChangeError("New password must be different from current password");
            return;
        }

        setPasswordChangeLoading(true);

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPasswordChangeError(data.message || "Failed to change password");
                return;
            }

            setPasswordChangeSuccess("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setShowCurrentPassword(false);
            setShowNewPassword(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setPasswordChangeSuccess("");
            }, 3000);
        } catch (err) {
            setPasswordChangeError("An error occurred while changing password");
            console.error(err);
        } finally {
            setPasswordChangeLoading(false);
        }
    };

    const handleChangeUsername = async () => {
        // Reset previous messages
        setUsernameChangeError("");
        setUsernameChangeSuccess("");

        // Validation
        if (!newUsername.trim()) {
            setUsernameChangeError("Username cannot be empty");
            return;
        }

        if (newUsername.trim().length < 2) {
            setUsernameChangeError("Username must be at least 2 characters");
            return;
        }

        if (newUsername.trim().length > 100) {
            setUsernameChangeError("Username must be no more than 100 characters");
            return;
        }

        if (newUsername.trim() === userProfile?.userName) {
            setUsernameChangeError("New username must be different from current username");
            return;
        }

        setUsernameChangeLoading(true);

        try {
            const response = await fetch("/api/auth/change-username", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    newUsername: newUsername.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setUsernameChangeError(data.message || "Failed to change username");
                return;
            }

            setUsernameChangeSuccess("Username changed successfully!");
            setIsEditingUsername(false);
            
            // Refetch user profile to update the display immediately
            await refetch();

            // Clear success message after 3 seconds
            setTimeout(() => {
                setUsernameChangeSuccess("");
            }, 3000);
        } catch (err) {
            setUsernameChangeError("An error occurred while changing username");
            console.error(err);
        } finally {
            setUsernameChangeLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoaderOne />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center backdrop-blur-sm bg-white/10 rounded-2xl p-8 border border-white/20 shadow-xl">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-lg font-semibold text-red-400 mb-2">Помилка завантаження</p>
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-linear-to-r from-white via-blue-200 to-accent bg-clip-text text-transparent mb-3 sm:mb-4">
                            Налаштування
                        </h1>
                        <p className="text-sm sm:text-lg text-blue-200 font-medium">Керуйте своїми налаштуваннями та конфіденційністю</p>
                    </div>

                    <div className="space-y-6">
                        {/* Account Section */}
                        <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Shield className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-white">Обліковий запис</h2>
                                        <p className="text-xs sm:text-sm text-white/60">Інформація про ваш акаунт</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-white/10">
                                    <div className="flex-1">
                                        <p className="font-medium text-white">Ім&apos;я</p>
                                        {!isEditingUsername ? (
                                            <p className="text-sm text-white/60">{userProfile?.userName || 'Не вказано'}</p>
                                        ) : (
                                            <div className="mt-2 space-y-2">
                                                <Input
                                                    type="text"
                                                    value={newUsername}
                                                    onChange={(e) => setNewUsername(e.target.value)}
                                                    placeholder="Enter new username"
                                                    className="bg-white/10 border-white/20 h-10 text-white rounded-lg"
                                                />
                                                {usernameChangeError && (
                                                    <p className="text-xs text-red-400">{usernameChangeError}</p>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={handleChangeUsername}
                                                        disabled={usernameChangeLoading}
                                                        size="sm"
                                                        className="bg-accent hover:bg-accent/90 text-white rounded-lg disabled:opacity-50"
                                                    >
                                                        {usernameChangeLoading ? "Збереження..." : "Зберегти"}
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            setIsEditingUsername(false);
                                                            setNewUsername(userProfile?.userName || "");
                                                            setUsernameChangeError("");
                                                            setUsernameChangeSuccess("");
                                                        }}
                                                        disabled={usernameChangeLoading}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-white/60 hover:text-white disabled:opacity-50"
                                                    >
                                                        Скасувати
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {!isEditingUsername && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setIsEditingUsername(true);
                                                setNewUsername(userProfile?.userName || "");
                                                setUsernameChangeError("");
                                            }}
                                            className="text-accent hover:text-accent/80"
                                        >
                                            Змінити
                                        </Button>
                                    )}
                                </div>
                                {usernameChangeSuccess && (
                                    <div className="flex items-center gap-3 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <p className="text-sm text-emerald-200">{usernameChangeSuccess}</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between py-3 border-b border-white/10">
                                    <div>
                                        <p className="font-medium text-white">Номер телефону</p>
                                        <p className="text-sm text-white/60">{userProfile?.phoneNumber || 'Не вказано'}</p>
                                    </div>
                                    <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">Підтверджено</span>
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Lock className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-white">Безпека</h2>
                                        <p className="text-xs sm:text-sm text-white/60">Змініть пароль та налаштування безпеки</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <Label htmlFor="currentPassword" className="text-sm font-medium text-white/80 mb-2 block">
                                        Поточний пароль
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showCurrentPassword ? "text" : "password"}
                                            id="currentPassword"
                                            placeholder="Введіть поточний пароль"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="bg-white/10 border-white/20 h-12 text-white rounded-xl pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="newPassword" className="text-sm font-medium text-white/80 mb-2 block">
                                        Новий пароль
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showNewPassword ? "text" : "password"}
                                            id="newPassword"
                                            placeholder="Введіть новий пароль"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="bg-white/10 border-white/20 h-12 text-white rounded-xl pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                {passwordChangeError && (
                                    <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                        <p className="text-sm text-red-200">{passwordChangeError}</p>
                                    </div>
                                )}
                                {passwordChangeSuccess && (
                                    <div className="flex items-center gap-3 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <p className="text-sm text-emerald-200">{passwordChangeSuccess}</p>
                                    </div>
                                )}
                                <Button 
                                    onClick={handleChangePassword}
                                    disabled={passwordChangeLoading}
                                    className="bg-accent hover:bg-accent/90 text-white rounded-xl h-12 w-full sm:w-auto disabled:opacity-50"
                                >
                                    {passwordChangeLoading ? "Оновлення..." : "Оновити пароль"}
                                </Button>
                            </div>
                        </div>

                        {/* Notifications Section */}
                        <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Bell className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-white">Сповіщення</h2>
                                        <p className="text-xs sm:text-sm text-white/60">Налаштуйте способи отримання сповіщень</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-white/60" />
                                        <div>
                                            <p className="font-medium text-white">Email сповіщення</p>
                                            <p className="text-sm text-white/60">Отримувати сповіщення на email</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            notifications.email ? 'bg-accent' : 'bg-white/20'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                                            notifications.email ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="w-5 h-5 text-white/60" />
                                        <div>
                                            <p className="font-medium text-white">SMS сповіщення</p>
                                            <p className="text-sm text-white/60">Отримувати SMS про важливі оновлення</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, sms: !prev.sms }))}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            notifications.sms ? 'bg-accent' : 'bg-white/20'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                                            notifications.sms ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <Bell className="w-5 h-5 text-white/60" />
                                        <div>
                                            <p className="font-medium text-white">Push-сповіщення</p>
                                            <p className="text-sm text-white/60">Сповіщення в браузері</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            notifications.push ? 'bg-accent' : 'bg-white/20'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                                            notifications.push ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Appearance Section */}
                        <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Palette className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-white">Зовнішній вигляд</h2>
                                        <p className="text-xs sm:text-sm text-white/60">Налаштуйте тему та мову інтерфейсу</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <p className="font-medium text-white mb-3">Тема</p>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {[
                                            { value: 'light', label: 'Світла', icon: Sun },
                                            { value: 'dark', label: 'Темна', icon: Moon },
                                            { value: 'system', label: 'Системна', icon: Settings }
                                        ].map(({ value, label, icon: Icon }) => (
                                            <button
                                                key={value}
                                                onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                                                className={`p-3 sm:p-4 rounded-xl border transition-all flex flex-col items-center gap-1.5 sm:gap-2 ${
                                                    theme === value
                                                        ? 'bg-accent/20 border-accent'
                                                        : 'bg-white/5 border-white/10 hover:border-white/30'
                                                }`}
                                            >
                                                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === value ? 'text-accent' : 'text-white/60'}`} />
                                                <span className={`text-xs sm:text-sm ${theme === value ? 'text-accent' : 'text-white/80'}`}>{label}</span>
                                                {theme === value && <Check className="w-4 h-4 text-accent" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-5 h-5 text-white/60" />
                                            <div>
                                                <p className="font-medium text-white">Мова інтерфейсу</p>
                                                <p className="text-sm text-white/60">Українська</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/40" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                            <Button className="bg-accent hover:bg-accent/90 text-white rounded-xl h-12 w-full sm:w-auto px-8">
                                Зберегти налаштування
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
