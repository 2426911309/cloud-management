import sys
import os

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from datetime import datetime

# 现在应该可以正常导入了
from utils.detector import get_detector, MeterDetector

app = FastAPI(
    title="云巡检AI识别服务",
    description="YOLOv8表计识别API",
    version="1.0.0"
)

# CORS配置（移到app定义之后）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # 生产环境可限制为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class DetectionRequest(BaseModel):
    image: Optional[str] = None
    device_id: Optional[int] = None
    rtsp_url: Optional[str] = None

# 全局检测器
detector: Optional[MeterDetector] = None

@app.on_event("startup")
async def load_model():
    """启动时加载模型"""
    global detector
    try:
        detector = get_detector()
        print("✅ YOLOv8模型加载完成")
    except Exception as e:
        print(f"❌ 模型加载失败: {e}")
        # 不抛出异常，让服务继续运行，但检测功能不可用

@app.get("/")
async def root():
    return {
        "service": "云巡检AI识别服务",
        "status": "running",
        "model": "YOLOv8",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "model_loaded": detector is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/detect")
async def detect_meter(request: DetectionRequest):
    """单张图片检测（直接返回原始结果，包含detections）"""
    if detector is None:
        raise HTTPException(status_code=503, detail="模型未加载")

    try:
        if request.image:
            result = detector.detect(request.image)
        elif request.rtsp_url:
            result = detector.process_rtsp_frame(request.rtsp_url)
        else:
            raise HTTPException(status_code=400, detail="请提供图片或RTSP地址")

        if not result['success']:
            raise HTTPException(status_code=500, detail=result.get('error', '检测失败'))

        # 直接返回原始结果（包含detections字段）
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1
    )