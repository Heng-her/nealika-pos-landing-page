import React from "react";
import { Edit2 } from "lucide-react";

export interface ProfileFormState {
  username: string;
  nickname: string;
  email: string;
  mobile: string;
  bio: string;
  businessName: string;
  address: string;
  avatarUrl: string;
  avatarPreviewUrl: string;
  pendingAvatarFile: File | null;
  hasPendingAvatarChange: boolean;
}

interface ProfilePageProps {
  profile: ProfileFormState;
  setProfile: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  logo: string;
  isEditingProfile: boolean;
  setIsEditingProfile: (val: boolean) => void;
  isLoadingProfile: boolean;
  isSavingProfile: boolean;
  onCancelEdit: () => void;
  onUpdateProfile: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ProfilePage({
  profile,
  setProfile,
  logo,
  isEditingProfile,
  setIsEditingProfile,
  isLoadingProfile,
  isSavingProfile,
  onCancelEdit,
  onUpdateProfile,
}: ProfilePageProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Profile Information
        </h2>
        {!isEditingProfile && !isLoadingProfile && (
          <button
            onClick={() => {
              setIsEditingProfile(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {isLoadingProfile ? (
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-slate-200 rounded"></div>
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                <div className="h-6 w-full bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : !isEditingProfile ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center overflow-hidden p-1 shadow-inner">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <img
                  src={logo}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {profile.nickname || profile.username || "N/A"}
              </h3>
              <p className="text-slate-600">
                {profile.username ? `@${profile.username}` : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-500">
                Username
              </label>
              <p className="text-slate-900 mt-1">{profile.username || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">
                Nickname
              </label>
              <p className="text-slate-900 mt-1">{profile.nickname || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">Email</label>
              <p className="text-slate-900 mt-1">{profile.email || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">
                Mobile
              </label>
              <p className="text-slate-900 mt-1">{profile.mobile || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">
                Business Name
              </label>
              <p className="text-slate-900 mt-1">
                {profile.businessName || "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">
                Address
              </label>
              <p className="text-slate-900 mt-1">{profile.address || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-500">Bio</label>
              <p className="text-slate-900 mt-1 whitespace-pre-wrap">
                {profile.bio || "-"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onUpdateProfile} className="space-y-4">
          {/* Avatar Upload */}
          <div className="border-b border-slate-100 pb-4 mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center overflow-hidden p-1 shadow-inner">
                {profile.avatarPreviewUrl ? (
                  <img
                    src={profile.avatarPreviewUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <img
                    src={logo}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  type="file"
                  accept="image/*"
                  id="avatar-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfile((prev) => ({
                          ...prev,
                          avatarPreviewUrl: reader.result as string,
                          pendingAvatarFile: file,
                          hasPendingAvatarChange: true,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label
                  htmlFor="avatar-upload"
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-center transition-colors"
                >
                  Upload Photo
                </label>
                {profile.hasPendingAvatarChange && (
                  <button
                    type="button"
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        avatarPreviewUrl: prev.avatarUrl,
                        pendingAvatarFile: null,
                        hasPendingAvatarChange: false,
                      }))
                    }
                    className="text-xs text-red-600 hover:text-red-800 text-left font-medium"
                  >
                    Reset Selected Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                defaultValue={profile.username}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                name="nickname"
                defaultValue={profile.nickname}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mobile
              </label>
              <input
                type="tel"
                value={profile.mobile}
                readOnly
                className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                defaultValue={profile.bio}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                name="business_name"
                defaultValue={profile.businessName}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                defaultValue={profile.address}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
