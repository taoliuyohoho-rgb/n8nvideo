import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/recommendation/settings - 获取推荐配置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario');

    if (scenario) {
      const setting = await prisma.recommendationSetting.findUnique({
        where: { scenario }
      });
      return NextResponse.json({
        success: true,
        data: setting
      });
    }

    const settings = await prisma.recommendationSetting.findMany();
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error('获取推荐配置失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/recommendation/settings - 创建或更新推荐配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scenario,
      mode,
      mCoarse,
      kFine,
      epsilon,
      minExplore,
      diversity,
      qualityFloorRej,
      qualityFloorStr,
      costOverrunMul,
      latencySoftMs,
      latencyHardMs,
      segmentTemplate
    } = body;

    if (!scenario) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: scenario' },
        { status: 400 }
      );
    }

    const setting = await prisma.recommendationSetting.upsert({
      where: { scenario },
      create: {
        scenario,
        mode: mode || 'rule',
        mCoarse: mCoarse || 10,
        kFine: kFine || 3,
        epsilon: epsilon || 0.10,
        minExplore: minExplore || 0.05,
        diversity: diversity !== undefined ? diversity : true,
        qualityFloorRej: qualityFloorRej || 0.20,
        qualityFloorStr: qualityFloorStr || 0.90,
        costOverrunMul: costOverrunMul || 1.50,
        latencySoftMs: latencySoftMs || 6000,
        latencyHardMs: latencyHardMs || 8000,
        segmentTemplate: segmentTemplate || ''
      },
      update: {
        mode,
        mCoarse,
        kFine,
        epsilon,
        minExplore,
        diversity,
        qualityFloorRej,
        qualityFloorStr,
        costOverrunMul,
        latencySoftMs,
        latencyHardMs,
        segmentTemplate
      }
    });

    return NextResponse.json({
      success: true,
      data: setting
    });
  } catch (error: any) {
    console.error('保存推荐配置失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

