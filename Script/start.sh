#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_project_root() {
    local dir="$1"
    while [[ "$dir" != "/" ]]; do
        if [[ -f "$dir/.monconfig" ]]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

PROJECT_ROOT=$(find_project_root "$SCRIPT_DIR")

if [[ -z "$PROJECT_ROOT" ]]; then
    echo "错误：未找到 .monconfig 配置文件"
    exit 1
fi

FRONTEND_DIR="$PROJECT_ROOT/Code/GptSov_Front"
MONCONFIG_FILE="$PROJECT_ROOT/.monconfig"

if [[ ! -d "$FRONTEND_DIR" ]]; then
    echo "错误：前端目录不存在: $FRONTEND_DIR"
    exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    echo "错误：node_modules 不存在，请先运行 npm install"
    exit 1
fi

# 读取 .monconfig 文件中的端口配置（默认值）
FRONTEND_PORT=40031
MON_GSV_PORT=40032

if [[ -f "$MONCONFIG_FILE" ]]; then
    # 从 .monconfig 读取前端端口
    FRONTEND_PORT=$(grep -A 5 "^\[frontend\]" "$MONCONFIG_FILE" | grep "^PORT=" | cut -d'=' -f2 | tr -d '[:space:]' | head -1)
    # 从 .monconfig 读取后端端口
    MON_GSV_PORT=$(grep -A 5 "^\[server\]" "$MONCONFIG_FILE" | grep "^PORT=" | cut -d'=' -f2 | tr -d '[:space:]' | head -1)

    # 如果读取失败，使用默认值
    [[ -z "$FRONTEND_PORT" ]] && FRONTEND_PORT=40031
    [[ -z "$MON_GSV_PORT" ]] && MON_GSV_PORT=40032

    echo "从 $MONCONFIG_FILE 读取配置:"
    echo "  FRONTEND_PORT=$FRONTEND_PORT"
    echo "  MON_GSV_PORT=$MON_GSV_PORT"
else
    echo "警告：未找到 .monconfig 文件，使用默认端口"
fi

cd "$FRONTEND_DIR"

BUILD_MODE="${1:-dev}"

if [[ "$BUILD_MODE" == "prod" ]] || [[ "$BUILD_MODE" == "production" ]]; then
    if [[ ! -d "$FRONTEND_DIR/dist" ]]; then
        echo "编译后的 dist 目录不存在，正在构建..."
        npm run build
    fi
    echo "启动生产模式 (preview)，端口: $FRONTEND_PORT..."
    exec npx vite preview --port "$FRONTEND_PORT" --host 0.0.0.0
else
    echo "启动开发模式，端口: $FRONTEND_PORT..."
    exec npx vite dev --port "$FRONTEND_PORT" --host 0.0.0.0
fi
