# 项目重构说明

## 新的目录结构

项目已重构为基于页面的模块化结构，每个页面都有独立的文件夹。

```
GptSov_Front/
├── pages/                    # 页面目录
│   ├── synthesis/           # 语音合成页面
│   │   ├── index.tsx        # 主组件
│   │   ├── types.ts         # 页面特定类型
│   │   ├── constants.ts     # 页面特定常量
│   │   └── hooks.ts        # 页面特定hooks
│   ├── training/            # 模型训练页面
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── hooks.ts
│   ├── emotion/             # 情感配置页面
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   └── constants.ts
│   └── settings/            # 设置页面
│       ├── index.tsx
│       ├── types.ts
│       ├── constants.ts
│       └── components/      # 页面特定组件
│           └── TerminalView.tsx
├── components/              # 共享组件
│   └── shared/
│       └── Navigation.tsx   # 导航组件
├── types/                   # 共享类型定义
│   └── index.ts
├── services/               # 服务层
│   └── geminiService.ts
├── utils/                  # 工具函数（预留）
├── hooks/                  # 共享hooks（预留）
└── App.tsx                 # 主应用入口
```

## 重构原则

1. **页面模块化**：每个页面都是独立的文件夹，包含该页面所需的所有资源
2. **关注点分离**：类型、常量、hooks、组件分别放在对应文件中
3. **共享资源**：跨页面使用的组件、类型放在共享目录
4. **清晰的导入路径**：使用相对路径，结构清晰

## 迁移说明

### 已迁移的组件

- `SynthesisView` → `pages/synthesis/index.tsx`
- `TrainingDashboard` → `pages/training/index.tsx`
- `EmotionConfigView` → `pages/emotion/index.tsx`
- `SettingsPanel` → `pages/settings/index.tsx`
- `TerminalView` → `pages/settings/components/TerminalView.tsx`
- `Navigation` → `components/shared/Navigation.tsx`

### 导入路径更新

所有导入路径已更新：
- `App.tsx` 中的页面导入已更新为新路径
- `Navigation` 组件的类型导入已更新

## 后续建议

1. 可以考虑将 `types.ts` 中的共享类型移到 `types/index.ts`
2. 如果页面有复杂的子组件，可以在页面目录下创建 `components/` 子目录
3. 页面特定的工具函数可以放在页面目录下的 `utils.ts` 文件中






