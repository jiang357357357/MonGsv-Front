import { TrainingPhase } from './types';
import { Scissors, Mic, FileText, FileAudio, ScanLine, BrainCircuit, Box } from 'lucide-react';

/**
 * 训练阶段定义（根据后端实际步骤）
 * 1. slice - 音频切分
 * 2. asr - ASR语音识别
 * 3. prepare-1a - 文本分词与特征提取
 * 4. prepare-1b - 语音自监督特征提取
 * 5. prepare-1c - 语义Token提取
 * 6. sovits - SoVITS训练
 * 7. gpt - GPT训练
 */
export const TRAINING_PHASES: TrainingPhase[] = [
  {
    id: 'phase1',
    title: '音频切分',
    subtitle: 'AUDIO_SLICE',
    icon: Scissors,
    subSteps: [
      { id: 'p1_1', label: '分析音频音量曲线' },
      { id: 'p1_2', label: '切分音频片段' },
      { id: 'p1_3', label: '保存切分结果' }
    ]
  },
  {
    id: 'phase2',
    title: 'ASR语音识别',
    subtitle: 'ASR_RECOGNITION',
    icon: Mic,
    subSteps: [
      { id: 'p2_1', label: '加载ASR模型' },
      { id: 'p2_2', label: '识别语音转文本' },
      { id: 'p2_3', label: '生成标注文件' }
    ]
  },
  {
    id: 'phase3',
    title: '文本分词与特征提取',
    subtitle: 'STEP_1A_BERT_TOKENIZATION',
    icon: FileText,
    subSteps: [
      { id: 'p3_1', label: '加载中文BERT模型' },
      { id: 'p3_2', label: '生成音素与音调' },
      { id: 'p3_3', label: '保存文本特征张量' }
    ]
  },
  {
    id: 'phase4',
    title: '语音自监督特征提取',
    subtitle: 'STEP_1B_SSL_FEATURE',
    icon: FileAudio,
    subSteps: [
      { id: 'p4_1', label: '加载SSL模型' },
      { id: 'p4_2', label: '提取语音特征' },
      { id: 'p4_3', label: '保存声学特征' }
    ]
  },
  {
    id: 'phase5',
    title: '语义Token提取',
    subtitle: 'STEP_1C_SEMANTIC_TOKEN',
    icon: ScanLine,
    subSteps: [
      { id: 'p5_1', label: '加载语义模型' },
      { id: 'p5_2', label: '提取语义Token' },
      { id: 'p5_3', label: '保存语义数据' }
    ]
  },
  {
    id: 'phase6',
    title: 'SoVITS训练',
    subtitle: 'SOVITS_TRAINING',
    icon: BrainCircuit,
    subSteps: [
      { id: 'p6_1', label: '准备训练数据' },
      { id: 'p6_2', label: '训练SoVITS模型' },
      { id: 'p6_3', label: '保存模型权重' }
    ]
  },
  {
    id: 'phase7',
    title: 'GPT训练',
    subtitle: 'GPT_TRAINING',
    icon: Box,
    subSteps: [
      { id: 'p7_1', label: '准备训练数据' },
      { id: 'p7_2', label: '训练GPT模型' },
      { id: 'p7_3', label: '保存模型权重' }
    ]
  }
];
