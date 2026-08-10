import React from 'react';
import { Fingerprint, SlidersHorizontal, UserRound } from 'lucide-react';
import { AppView } from '../../../types';
import MainLayout from '../../Public/Components/Shared/MainLayout';

const PROFILE_SECTIONS = [
  {
    title: '个人资料',
    description: '维护当前用户的基础身份信息。',
    icon: UserRound,
  },
  {
    title: '声纹身份',
    description: '管理用于语音识别门禁的个人声纹。',
    icon: Fingerprint,
  },
  {
    title: '使用偏好',
    description: '设置个人常用的语言与交互偏好。',
    icon: SlidersHorizontal,
  },
];

const ProfileSettings: React.FC = () => (
  <MainLayout
    currentView={AppView.PROFILE}
    title="个人配置"
    subtitle="管理个人资料、声纹身份与使用偏好。"
  >
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {PROFILE_SECTIONS.map((section) => {
        const Icon = section.icon;

        return (
          <section key={section.title} className="theme-card rounded-2xl border p-6">
            <div className="theme-nav-icon flex h-12 w-12 items-center justify-center rounded-xl">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="theme-title mt-5 text-lg font-black">{section.title}</h3>
            <p className="theme-subtitle mt-2 text-sm leading-6">{section.description}</p>
          </section>
        );
      })}
    </div>
  </MainLayout>
);

export default ProfileSettings;
