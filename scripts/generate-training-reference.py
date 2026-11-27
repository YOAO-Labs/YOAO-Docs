#!/usr/bin/env python3
"""Render complete training parameter tables from YOAO-Plugins and Plugin-SDK.

Run with python3 (requires pydantic>=2.5 from yoao_plugin_sdk.trainer), optionally
passing --check. Only marked blocks are replaced, so explanatory prose remains
manually maintained.
"""

from __future__ import annotations

import argparse
from collections import Counter
import json
import os
import re
from pathlib import Path
import sys

sys.dont_write_bytecode = True
DOCS_ROOT = Path(__file__).resolve().parents[1]


def _resolve_repo(env_var: str, candidates: tuple[str, ...], label: str) -> Path:
    override = os.environ.get(env_var)
    if override:
        resolved = Path(override).resolve()
        if not resolved.is_dir():
            raise SystemExit(
                f"[generate-training-reference] {env_var} 指向的目录不存在：{resolved}"
            )
        return resolved
    for rel in candidates:
        candidate = (DOCS_ROOT / rel).resolve()
        if candidate.is_dir():
            return candidate
    raise SystemExit(
        f"[generate-training-reference] 未找到{label}目录，请设置环境变量 {env_var} 后重试。"
    )


PLUGINS_ROOT = _resolve_repo(
    "YOAO_PLUGINS_REPO_PATH",
    ("_sources/YOAO-Plugins", "../YOAO-Plugins", "../YOAO-plugins/main"),
    "官方插件仓库 YOAO-Plugins",
)
PLUGIN_SDK_ROOT = _resolve_repo(
    "YOAO_PLUGIN_SDK_REPO_PATH",
    ("_sources/Plugin-SDK", "../Plugin-SDK", "../Plugin-SDK/main"),
    "插件 SDK 仓库 Plugin-SDK",
)

sys.path[:0] = [
    str(PLUGIN_SDK_ROOT / "packages/python/src"),
    str(PLUGINS_ROOT / "plugins/trainer/ultralytics"),
    str(PLUGINS_ROOT / "plugins/trainer/libreyolo"),
]

from yoao_trainer_libreyolo.catalog import parameter_schema as libreyolo_schema  # noqa: E402
from yoao_trainer_ultralytics.catalog import (  # noqa: E402
    parameter_schema_for as ultralytics_schema_for,
)


def definition(framework: str, base_model: str | None = None) -> dict:
    if framework == "ultralytics":
        return ultralytics_schema_for(base_model or "yolo11n")
    if framework == "libreyolo":
        return libreyolo_schema()
    raise ValueError(f"Unsupported framework: {framework}")


LABELS = {
    "agnostic_nms": "类别无关 NMS",
    "allow_download_scripts": "数据下载脚本",
    "amp": "混合精度",
    "amp_dtype": "混合精度类型",
    "angle": "旋转角损失权重",
    "augment": "预测时增强",
    "auto_augment": "分类自动增强策略",
    "aux_weight": "辅助检测头损失权重",
    "average_best": "最佳检查点平均数量",
    "batch": "固定批大小",
    "bgr": "通道顺序交换概率",
    "box": "框回归损失权重",
    "cache": "数据缓存",
    "cfg": "外部配置路径",
    "channels_last": "通道布局",
    "class_balanced": "按类别平衡采样",
    "class_weights": "类别加权",
    "classes": "类别过滤",
    "close_mosaic": "末尾关闭 Mosaic 的轮次",
    "cls": "分类损失权重",
    "cls_pw": "类别正样本加权",
    "cls_remap": "类别重映射",
    "compile": "编译模型",
    "conf": "评估置信度阈值",
    "copy_paste": "实例 Copy/Paste 概率",
    "copy_paste_mode": "Copy/Paste 来源模式",
    "cos_lr": "余弦学习率计划",
    "crop_pct": "分类裁剪比例",
    "cuda_graph": "CUDA Graph",
    "cutmix": "CutMix 概率",
    "data": "固定数据集",
    "data_dir": "数据目录",
    "degrees": "随机旋转角度",
    "deterministic": "确定性算法",
    "device": "执行设备",
    "dfl": "分布焦点损失权重",
    "dgrad": "深度梯度损失权重",
    "dis": "蒸馏损失权重",
    "distill_loss_type": "蒸馏损失类型",
    "distill_mask_ratio": "蒸馏掩码比例",
    "distill_model": "蒸馏教师模型",
    "distill_normalize": "蒸馏特征归一化",
    "distill_tau": "蒸馏温度",
    "dlam": "深度损失组合权重",
    "dlog": "深度对数损失权重",
    "dnn": "OpenCV DNN 推理",
    "dropout": "分类头 Dropout",
    "dynamic": "动态导出尺寸",
    "ema": "指数移动平均权重",
    "ema_decay": "EMA 衰减系数",
    "embed": "提取特征层",
    "epochs": "训练轮次",
    "erasing": "分类随机擦除概率",
    "eval_interval": "验证间隔",
    "eval_max_det": "COCO 评估检测数",
    "evaluate_train": "逐轮评估训练集",
    "exist_ok": "允许已有目录",
    "export_check": "训练后导出检查",
    "faster_coco_eval": "加速 COCO 评估",
    "flip_prob": "左右翻转概率",
    "fliplr": "左右翻转概率",
    "flipud": "上下翻转概率",
    "format": "模型导出格式",
    "fraction": "数据使用比例",
    "freeze": "冻结层或模块（需验证具体命中）",
    "hsv_h": "色相扰动",
    "hsv_prob": "HSV 扰动概率",
    "hsv_s": "饱和度扰动",
    "hsv_v": "明度扰动",
    "imgsz": "输入尺寸",
    "iou": "评估 NMS 阈值",
    "kobj": "关键点目标损失权重",
    "letterbox_pad": "Letterbox 填充位置",
    "line_width": "绘图线宽",
    "log_interval": "日志间隔",
    "lora": "LoRA",
    "lr0": "初始学习率",
    "lrf": "最终学习率比例",
    "mask_downsample_ratio": "分割掩码下采样比例",
    "mask_ratio": "训练掩码下采样比例",
    "max_det": "最大检测数",
    "max_labels": "每张图片最大训练框数",
    "min_lr_ratio": "最低学习率比例",
    "min_samples": "每轮数据集样本数下限",
    "mixup": "MixUp 概率",
    "mixup_prob": "MixUp 概率",
    "mixup_scale": "MixUp 缩放区间",
    "mode": "运行模式",
    "model": "初始化权重",
    "momentum": "动量 / Adam β1",
    "mosaic": "Mosaic 概率",
    "mosaic_prob": "Mosaic 概率",
    "mosaic_scale": "Mosaic 缩放区间",
    "multi_scale": "多尺度训练幅度",
    "name": "输出子目录",
    "nbs": "标称批大小（梯度累积）",
    "nesterov": "Nesterov 动量",
    "nms": "模型 NMS",
    "no_aug_epochs": "末尾关闭增强的轮次",
    "num_classes": "类别数量",
    "opset": "ONNX 算子集",
    "optimize": "导出优化",
    "optimizer": "优化器",
    "overlap_mask": "合并实例训练掩码",
    "patience": "早停耐心轮次",
    "perspective": "透视幅度",
    "plot_samples": "绘图样本数",
    "plots": "原生绘图",
    "pose": "姿态损失权重",
    "precise_bn": "精确 BN 统计批次数",
    "pretrained": "使用预训练权重",
    "profile": "性能分析",
    "profile_open": "打开性能追踪",
    "profile_steps": "性能分析采样步数",
    "profile_then_stop": "性能分析后停止",
    "profile_trace": "保存性能追踪",
    "profile_warmup": "性能分析预热步数",
    "project": "输出根目录",
    "quantize": "量化训练",
    "rect": "矩形批训练",
    "resume": "断点恢复",
    "retina_masks": "原图分辨率推理掩码",
    "rle": "关键点 RLE 损失权重",
    "rot90": "旋转框直角旋转概率",
    "save": "保存权重",
    "save_conf": "保存预测置信度",
    "save_crop": "保存目标裁剪图",
    "save_frames": "保存视频帧",
    "save_json": "导出评测 JSON",
    "save_period": "周期保存",
    "save_plots": "原生绘图",
    "save_txt": "保存预测文本",
    "scale": "随机缩放幅度或区间",
    "scheduler": "学习率计划",
    "seed": "随机种子",
    "shear": "随机剪切角度",
    "show": "显示结果窗口",
    "show_boxes": "显示检测框",
    "show_conf": "显示置信度",
    "show_labels": "显示类别名称",
    "simplify": "简化导出模型",
    "single_cls": "单类别模式",
    "size": "模型规格",
    "source": "预测输入来源",
    "split": "验证分区",
    "stream_buffer": "视频流缓冲",
    "sync_bn": "同步批归一化",
    "task": "任务类型",
    "time": "按时间终止",
    "tracker": "视频跟踪器配置",
    "translate": "随机平移比例",
    "val": "每轮验证",
    "val_loss": "计算验证损失",
    "verbose": "详细日志",
    "vid_stride": "视频帧步长",
    "visualize": "特征可视化",
    "warmup_bias_lr": "偏置预热学习率",
    "warmup_epochs": "预热轮次",
    "warmup_lr_start": "预热起始学习率",
    "warmup_momentum": "预热动量",
    "weight_decay": "权重衰减",
    "workers": "数据加载进程数",
    "workspace": "导出工作空间",
}

LIBREYOLO_LABEL_OVERRIDES = {
    "momentum": "SGD 动量",
    "scale": "其他路径的缩放区间",
    "mixup": "其他路径的 MixUp 参数",
    "cutmix": "其他路径的 CutMix 参数",
}

RUNTIME_VALUES = {
    "data": "冻结训练包的本地 YAML 路径",
    "model": "受控架构／初始化权重／续训检查点",
    "project": "本次执行的独立产物目录",
    "name": '`"framework"`',
    "exist_ok": "`false`",
    "resume": "首次 `false`；续训使用已核验检查点路径",
    "size": "由基础型号派生 `t/s/m/c`",
    "num_classes": "冻结的原生类别数量",
    "data_dir": "`null`，使用冻结 YAML 中的路径",
}
STATUS = {
    "editable": "可编辑",
    "platform-managed": "平台固定",
    "unqualified": "尚未验证",
    "inapplicable": "其他任务／模式",
}


def literal(value):
    return "`" + json.dumps(value, ensure_ascii=False, separators=(", ", ": ")) + "`"


def label(field, framework):
    key = field["key"]
    if framework == "libreyolo" and key in LIBREYOLO_LABEL_OVERRIDES:
        name = LIBREYOLO_LABEL_OVERRIDES[key]
    elif key in LABELS:
        name = LABELS[key]
    else:
        raw_name = field.get("label") or ""
        name = raw_name if raw_name and raw_name != key and not raw_name.isascii() else None
    if not name:
        raise ValueError(f"Missing parameter label: {framework}.{key}")
    return f"`{key}`<br>{name}"


def rule_text(rule):
    if "anyOf" in rule:
        return " 或 ".join(rule_text(part) for part in rule["anyOf"])
    if "enum" in rule:
        return "、".join(literal(item) for item in rule["enum"])
    kind = rule["type"]
    if kind == "boolean":
        return "布尔值"
    if kind == "null":
        return "`null`"
    if kind == "array":
        count = f"{rule.get('minItems', 0)} 至 {rule.get('maxItems', 100)} 项"
        if rule.get("minItems") == rule.get("maxItems"):
            count = f"{rule['minItems']} 项"
        suffix = "；按升序排列" if rule.get("ordered") else ""
        return f"{count}数组，元素为 {rule_text(rule['items'])}{suffix}"
    bounds = []
    if "minimum" in rule:
        bounds.append(f"≥ {rule['minimum']}")
    if "exclusiveMinimum" in rule:
        bounds.append(f"> {rule['exclusiveMinimum']}")
    if "maximum" in rule:
        bounds.append(f"≤ {rule['maximum']}")
    suffix = f"；{rule['multipleOf']} 的倍数" if "multipleOf" in rule else ""
    return ("整数" if kind == "integer" else "数值") + "，" + "，".join(bounds) + suffix


def platform_value(field):
    if field["status"] == "platform-managed" and field["key"] in RUNTIME_VALUES:
        return RUNTIME_VALUES[field["key"]]
    return literal(field["default"])


def table(headers, rows):
    return "\n".join(
        [
            "| " + " | ".join(headers) + " |",
            "| " + " | ".join("---" for _ in headers) + " |",
        ]
        + ["| " + " | ".join(row) + " |" for row in rows]
    )


def render(framework, base_model):
    schema = definition(framework, base_model)
    counts = Counter(field["status"] for field in schema["fields"])
    blocks = []
    seen = set()
    for status in STATUS:
        fields = [field for field in schema["fields"] if field["status"] == status]
        blocks.append(f"### {STATUS[status]}（{counts[status]} 项）")
        rows = []
        for field in fields:
            key = field["key"]
            if key in seen:
                raise ValueError(f"Duplicate parameter: {framework}.{key}")
            seen.add(key)
            native = (
                "平台扩展，无原生项"
                if field["defined_in"] == "platform"
                else literal(field["native_default"])
            )
            if status == "editable":
                note = rule_text(field["rules"])
                if field["aliases"]:
                    note += "；别名 " + "、".join(
                        literal(alias) for alias in field["aliases"]
                    )
                platform = platform_value(field)
            elif status == "platform-managed":
                platform, note = platform_value(field), "由平台管理，不能覆盖"
            else:
                platform = "不开放"
                note = (
                    "需要额外训练、恢复或产物资格验证"
                    if status == "unqualified"
                    else "当前检测训练不使用，或属于其他路径"
                )
                if framework == "libreyolo" and key in {"cuda_graph", "compile"}:
                    platform, note = "执行器固定 `false`", "功能尚未开放"
            rows.append([label(field, framework), native, platform, note])
        blocks.append(
            table(["参数与用途", "仓库默认", "平台默认或处理", "范围与说明"], rows)
        )
    if seen != {field["key"] for field in schema["fields"]}:
        raise ValueError("Incomplete parameter table")
    return "\n\n".join(blocks)


def segmentation():
    detect = {
        field["key"]: field for field in definition("ultralytics", "yolo11n")["fields"]
    }
    rows = []
    for field in definition("ultralytics", "yolo11n-seg")["fields"]:
        before = detect[field["key"]]
        if (field["default"], field["status"], field["rules"]) == (
            before["default"],
            before["status"],
            before["rules"],
        ):
            continue
        previous = STATUS[before["status"]]
        if before["status"] in {"editable", "platform-managed"}:
            previous += "，" + platform_value(before)
        note = (
            "分割任务身份" if field["key"] == "task" else "受控分割的实例掩码或变换约束"
        )
        rows.append(
            [
                label(field, "ultralytics"),
                previous,
                STATUS[field["status"]] + "，" + platform_value(field),
                note,
            ]
        )
    rows.append(
        [
            "`workers`<br>数据加载进程数",
            "平台固定 `2`",
            "简单多边形 `2`；原生实例 RLE `0`",
            "原生 RLE 数据桥接进一步固定，不由用户覆盖",
        ]
    )
    return table(["参数", "检测", "实例分割", "原因"], rows)


def normalized(text):
    lines = []
    for line in text.strip().splitlines():
        if line.lstrip().startswith("|"):
            parts = [part.strip() for part in line.split("|")]
            line = "|".join(
                "---" if re.fullmatch(r":?-+:?", part) else part for part in parts
            )
        lines.append(line.strip())
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    directory = DOCS_ROOT / "plugins/official/trainer"
    updates = {
        "ultralytics.md": {
            "ultralytics": render("ultralytics", "yolo11n"),
            "segmentation": segmentation(),
        },
        "libreyolo.md": {"libreyolo": render("libreyolo", "libreyolo9t")},
    }
    failures = []
    for filename, blocks in updates.items():
        path = directory / filename
        text = path.read_text(encoding="utf-8")
        for name, content in blocks.items():
            start = f"<!-- training-reference:{name}:start -->"
            end = f"<!-- training-reference:{name}:end -->"
            if text.count(start) != 1 or text.count(end) != 1:
                raise ValueError(f"Missing or repeated table markers in {filename}")
            prefix, rest = text.split(start)
            current, suffix = rest.split(end)
            if normalized(current) != normalized(content):
                failures.append(f"{filename}:{name}")
            text = prefix + start + "\n\n" + content + "\n\n" + end + suffix
        if not args.check:
            path.write_text(text, encoding="utf-8")
    if args.check and failures:
        raise SystemExit(
            "Training parameter tables need regeneration: " + ", ".join(failures)
        )
    counts = {
        framework: len(definition(framework)["fields"])
        for framework in ("ultralytics", "libreyolo")
    }
    print(
        "Training parameter tables "
        + ("are in sync" if args.check else "generated")
        + f": {counts}; segmentation differences included"
    )


if __name__ == "__main__":
    main()
