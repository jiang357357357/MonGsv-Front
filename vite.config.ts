import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 从 .monconfig 读取配置
function readMonConfig() {
    const monconfigPath = path.resolve(__dirname, '../../.monconfig');
    const defaultConfig = {
        frontendPort: 40031,
        backendPort: 40032
    };
    
    if (!fs.existsSync(monconfigPath)) {
        console.warn('[vite] .monconfig not found, using default ports');
        return defaultConfig;
    }
    
    try {
        const content = fs.readFileSync(monconfigPath, 'utf-8');
        
        // 解析 frontend 端口
        const frontendMatch = content.match(/\[frontend\][\s\S]*?PORT\s*=\s*(\d+)/);
        const frontendPort = frontendMatch ? parseInt(frontendMatch[1], 10) : defaultConfig.frontendPort;
        
        // 解析 server 端口
        const serverMatch = content.match(/\[server\][\s\S]*?PORT\s*=\s*(\d+)/);
        const backendPort = serverMatch ? parseInt(serverMatch[1], 10) : defaultConfig.backendPort;
        
        console.log(`[vite] Loaded ports from .monconfig: frontend=${frontendPort}, backend=${backendPort}`);
        
        return { frontendPort, backendPort };
    } catch (error) {
        console.warn('[vite] Failed to parse .monconfig, using default ports:', error);
        return defaultConfig;
    }
}

export default defineConfig(({ mode }) => {
    // 从 .monconfig 读取端口配置
    const monConfig = readMonConfig();
    
    // 从 Env/.env 加载其他环境变量
    const envPath = path.resolve(__dirname, '../../Env');
    const env = loadEnv(mode, envPath, '');
    
    return {
      server: {
        port: monConfig.frontendPort,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.MON_GSV_PORT': JSON.stringify(monConfig.backendPort),
        'process.env.FRONTEND_PORT': JSON.stringify(monConfig.frontendPort)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
