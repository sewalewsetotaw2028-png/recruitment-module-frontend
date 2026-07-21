import React, { useRef, useState } from 'react';
import type {
  CandidateProfileData,
  CandidateProfileTab,
} from '@/pages/Candidate/types';
import { THEME_COLORS, TYPOGRAPHY } from '@/config/theme';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PROFILE_THEME } from './profileTheme';
import Modal from '@/components/ui/Modal/Modal';

interface CandidateProfileHeaderProps {
  profile: CandidateProfileData;
  activeTab: CandidateProfileTab;
  setActiveTab: React.Dispatch<React.SetStateAction<CandidateProfileTab>>;
  totalExperience: number;
  onUploadAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
  uploading: boolean;
}

export const CandidateProfileHeader: React.FC<CandidateProfileHeaderProps> = ({
  profile,
  activeTab,
  setActiveTab,
  totalExperience,
  onUploadAvatar,
  onRemoveAvatar,
  uploading,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUploadAvatar(file);
    event.target.value = '';
  };

  const handleRemovePhoto = () => {
    setShowRemoveConfirm(false);
    onRemoveAvatar();
  };

  return (
    <div>
      {/* Cover Image Area */}
      <div 
        style={{
          height: '160px',
          background: `linear-gradient(135deg, ${PROFILE_THEME.primary} 0%, ${PROFILE_THEME.primaryLight} 50%, ${PROFILE_THEME.primaryDark} 100%)`,
          position: 'relative',
        }}
      >
        {/* Social Links Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            gap: '8px',
          }}
        >
          {profile.portfolio_url && (
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noreferrer"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: PROFILE_THEME.onPrimary,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Portfolio"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                language
              </span>
            </a>
          )}
          <Button
            size="sm"
            variant="tertiary"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              color: PROFILE_THEME.onPrimary,
              border: 'none',
            }}
            aria-label="Share profile"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              share
            </span>
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div 
        style={{
          padding: '24px 32px',
          backgroundColor: THEME_COLORS.surface,
          position: 'relative',
        }}
      >
        {/* Avatar with Upload/Remove Controls */}
        <div style={{ position: 'relative', width: '96px', marginTop: '-48px', marginBottom: '16px' }}>
          <div 
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${PROFILE_THEME.primary} 0%, ${PROFILE_THEME.primaryLight} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PROFILE_THEME.onPrimary,
              fontSize: TYPOGRAPHY.fontSize['3xl'],
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              boxShadow: `0 8px 24px color-mix(in srgb, ${PROFILE_THEME.primary} 18%, transparent)`,
              border: `4px solid ${THEME_COLORS.surface}`,
              overflow: 'hidden',
              cursor: profile.photo ? 'pointer' : 'default',
            }}
            onClick={() => profile.photo && setShowFullImage(true)}
          >
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={`${profile.firstName} ${profile.lastName}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              profile.firstName?.charAt(0).toUpperCase() || 'C'
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploading}
          />

          {/* Camera icon to upload photo */}
          <div
            onClick={() => {
              if (!uploading) avatarInputRef.current?.click();
            }}
            aria-label="Upload profile photo"
            style={{
              position: 'absolute',
              right: '0',
              bottom: '0',
              display: 'inline-flex',
              height: '28px',
              width: '28px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: `2px solid ${THEME_COLORS.surface}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              backgroundColor: PROFILE_THEME.primary,
              color: PROFILE_THEME.onPrimary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              opacity: uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              {uploading ? 'cloud_upload' : 'add_a_photo'}
            </span>
          </div>

          {/* Remove photo button (only when photo exists) */}
          {profile.photo && (
            <div
              onClick={() => setShowRemoveConfirm(true)}
              aria-label="Remove profile photo"
              role="button"
              tabIndex={0}
              style={{
                position: 'absolute',
                left: '0',
                bottom: '0',
                display: 'inline-flex',
                height: '28px',
                width: '28px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: `2px solid ${THEME_COLORS.surface}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                backgroundColor: '#ef4444',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                close
              </span>
            </div>
          )}
        </div>

        {/* Name, Title, and Contact Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 
              style={{
                fontSize: TYPOGRAPHY.heading.h2.fontSize,
                fontWeight: TYPOGRAPHY.heading.h2.fontWeight,
                lineHeight: TYPOGRAPHY.heading.h2.lineHeight,
                letterSpacing: TYPOGRAPHY.heading.h2.letterSpacing,
                color: THEME_COLORS.textPrimary,
                margin: 0,
              }}
            >
              {profile.firstName} {profile.lastName}
            </h1>
            {profile.current_position && (
              <p
                style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  color: THEME_COLORS.textTertiary,
                  margin: '4px 0 0 0',
                }}
              >
                {profile.current_position}
                {profile.current_employer ? ` at ${profile.current_employer}` : ''}
              </p>
            )}
            <div 
              className="flex flex-wrap items-center gap-4"
              style={{ marginTop: '8px' }}
            >
              <span 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  color: THEME_COLORS.textSecondary,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: THEME_COLORS.textTertiary }}>
                  email
                </span>
                {profile.email}
              </span>
              {profile.phone && (
                <span 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                    color: THEME_COLORS.textSecondary,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: THEME_COLORS.textTertiary }}>
                    phone
                  </span>
                  {profile.phone}
                </span>
              )}
              {profile.location && (
                <span 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                    color: THEME_COLORS.textSecondary,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: THEME_COLORS.textTertiary }}>
                    location_on
                  </span>
                  {profile.location}
                </span>
              )}
            </div>
          </div>

          {/* Experience Badge */}
          <Badge variant="primary" size="md">
            {totalExperience} {totalExperience === 1 ? 'Year' : 'Years'} Experience
          </Badge>
        </div>

        {/* Tab Navigation */}
        <div 
          style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            borderBottom: `1px solid ${THEME_COLORS.borderLight}`,
            paddingBottom: '0',
            marginBottom: '-24px',
          }}
        >
          {[
            { value: 'overview' as CandidateProfileTab, label: 'Overview' },
            { value: 'personal-details' as CandidateProfileTab, label: 'Personal Details' },
            {
              value: 'experience' as CandidateProfileTab,
              label: 'Experience',
              count: profile.experiences?.length || 0,
            },
            {
              value: 'education' as CandidateProfileTab,
              label: 'Education',
              count: profile.educations?.length || 0,
            },
            {
              value: 'certifications' as CandidateProfileTab,
              label: 'Certifications',
              count: profile.certifications?.length || 0,
            },
            {
              value: 'skills-languages' as CandidateProfileTab,
              label: 'Skills & Languages',
              count: (profile.skills?.length || 0) + (profile.languages?.length || 0),
            },
            {
              value: 'documents' as CandidateProfileTab,
              label: 'Documents',
              count: profile.documents?.length || 0,
            },
          ].map((tab) => {
            const isSelected = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  border: 'none',
                  boxShadow: isSelected
                    ? `inset 0 -2px 0 ${PROFILE_THEME.primary}`
                    : 'inset 0 -2px 0 transparent',
                  color: isSelected ? PROFILE_THEME.primary : THEME_COLORS.textTertiary,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  marginBottom: '-1px',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.color = THEME_COLORS.textSecondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.color = THEME_COLORS.textTertiary;
                  }
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <Badge 
                    variant={isSelected ? 'primary' : 'default'} 
                    size="sm"
                    style={{
                      backgroundColor: isSelected ? PROFILE_THEME.primary : THEME_COLORS.slate200,
                      color: isSelected ? THEME_COLORS.textInverse : THEME_COLORS.textSecondary,
                    }}
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Image Modal */}
      <Modal
        isOpen={showFullImage}
        onClose={() => setShowFullImage(false)}
        title="Profile Photo"
        size="md"
      >
        <div className="flex flex-col items-center gap-4">
          {profile.photo && (
            <img
              src={profile.photo}
              alt={`${profile.firstName} ${profile.lastName}`}
              className="max-w-full max-h-[70vh] rounded-xl object-contain"
            />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowFullImage(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Photo Confirmation Modal */}
      <Modal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        title="Remove Profile Photo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to remove your profile photo? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRemoveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleRemovePhoto}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
