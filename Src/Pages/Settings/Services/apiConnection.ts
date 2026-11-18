import { buildApiBaseUrl, type ApiConfig } from '../../../../System/Config';

export interface ApiConnectionResult {
  type: 'success' | 'warning' | 'error';
  message: string;
  url: string;
}

export const testApiConnection = async (config: ApiConfig): Promise<ApiConnectionResult> => {
  const url = `${buildApiBaseUrl(config)}/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      const hint = response.status === 404
        ? '请检查路径后缀，直接连接本项目网关时应留空。'
        : response.status === 401 || response.status === 403
        ? '请检查访问权限。'
        : '请检查后端服务状态。';
      throw new Error(`连接失败（HTTP ${response.status}）。${hint}`);
    }
    const payload = await response.json().catch(() => {
      throw new Error('该地址未返回有效的健康检查数据，请检查端口和路径后缀');
    });
    if (payload?.gateway_status !== 'healthy' || !payload.services || typeof payload.services !== 'object' || Array.isArray(payload.services)) {
      throw new Error('该地址未返回本项目的健康检查数据，请检查端口和路径后缀');
    }
    const services = Object.entries(payload.services);
    const failed = services.filter(([, service]) => ['error', 'load_error'].includes((service as { status?: string })?.status || ''));
    return {
      type: failed.length ? 'warning' : 'success',
      message: failed.length
        ? `后端已连接，${services.length - failed.length}/${services.length} 个服务可用。异常服务：${failed.map(([name]) => name).join('、')}`
        : `连接成功，${services.length} 个服务可用`,
      url,
    };
  } catch (error) {
    return {
      type: 'error',
      message: controller.signal.aborted
        ? '连接超时（10 秒），请检查后端地址和端口是否可访问'
        : error instanceof TypeError
        ? '无法连接后端，请检查地址、端口及浏览器的跨域访问限制'
        : error instanceof Error ? error.message : '连接失败',
      url,
    };
  } finally {
    clearTimeout(timer);
  }
};
