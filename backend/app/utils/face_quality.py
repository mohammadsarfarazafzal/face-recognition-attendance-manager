# backend/app/utils/face_quality.py — Image quality validation for face registration

import cv2
import numpy as np
import face_recognition
from pathlib import Path
import sys

# Config import
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from app.config import (
    MIN_FACE_SIZE,
    MIN_FACE_SHARPNESS,
    MIN_BRIGHTNESS,
    MAX_BRIGHTNESS,
    ANTI_SPOOF_ENABLED,
    ANTI_SPOOF_LBP_THRESHOLD,
)


def _compute_sharpness(gray_face):
    """
    Compute image sharpness using Laplacian variance.
    Higher value = sharper image. Blurry images have low variance.
    """
    laplacian = cv2.Laplacian(gray_face, cv2.CV_64F)
    return laplacian.var()


def _compute_brightness(gray_face):
    """Compute mean brightness of the face region (0-255)."""
    return float(np.mean(gray_face))


def _compute_lbp_variance(gray_face):
    """
    Compute Local Binary Pattern variance as a basic anti-spoofing heuristic.
    Real faces have higher texture complexity than printed photos.
    
    This is a simplified LBP — compares center pixel with 8 neighbors.
    """
    h, w = gray_face.shape
    if h < 10 or w < 10:
        return 0.0

    # Resize to consistent size for comparable results
    face_resized = cv2.resize(gray_face, (100, 100))
    
    lbp_values = []
    for i in range(1, 99):
        for j in range(1, 99):
            center = face_resized[i, j]
            # 8-neighbor LBP
            code = 0
            code |= (face_resized[i-1, j-1] >= center) << 7
            code |= (face_resized[i-1, j]   >= center) << 6
            code |= (face_resized[i-1, j+1] >= center) << 5
            code |= (face_resized[i, j+1]   >= center) << 4
            code |= (face_resized[i+1, j+1] >= center) << 3
            code |= (face_resized[i+1, j]   >= center) << 2
            code |= (face_resized[i+1, j-1] >= center) << 1
            code |= (face_resized[i, j-1]   >= center) << 0
            lbp_values.append(code)
    
    return float(np.var(lbp_values))


def validate_registration_image(image_path):
    """
    Validate an image for face registration quality.
    
    Returns:
        dict: {
            "valid": bool,
            "face_count": int,
            "face_location": tuple or None,  # (top, right, bottom, left)
            "sharpness": float,
            "brightness": float,
            "face_size": tuple or None,  # (width, height)
            "lbp_variance": float or None,
            "issues": list[str],
            "warnings": list[str]
        }
    """
    issues = []
    warnings = []
    result = {
        "valid": False,
        "face_count": 0,
        "face_location": None,
        "sharpness": 0.0,
        "brightness": 0.0,
        "face_size": None,
        "lbp_variance": None,
        "issues": issues,
        "warnings": warnings,
    }

    # Load image
    img = cv2.imread(str(image_path))
    if img is None:
        issues.append("Could not read image file. Please upload a valid image.")
        return result

    # Convert to RGB for face_recognition library
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ── Face Detection ──────────────────────────────────────────────
    face_locations = face_recognition.face_locations(img_rgb)
    result["face_count"] = len(face_locations)

    if len(face_locations) == 0:
        issues.append("No face detected in the image. Please upload a clear photo with a visible face.")
        return result

    if len(face_locations) > 1:
        issues.append(
            f"Multiple faces detected ({len(face_locations)}). "
            "Please upload a photo with only one face for registration."
        )
        return result

    # Single face found — proceed with quality checks
    top, right, bottom, left = face_locations[0]
    result["face_location"] = face_locations[0]
    face_width = right - left
    face_height = bottom - top
    result["face_size"] = (face_width, face_height)

    # ── Face Size Check ─────────────────────────────────────────────
    if face_width < MIN_FACE_SIZE or face_height < MIN_FACE_SIZE:
        issues.append(
            f"Face is too small ({face_width}x{face_height}px). "
            f"Minimum required: {MIN_FACE_SIZE}x{MIN_FACE_SIZE}px. "
            "Please move closer to the camera or upload a higher resolution photo."
        )

    # Extract face region for quality analysis
    # Add padding around face for better analysis
    pad = 10
    face_top = max(0, top - pad)
    face_bottom = min(gray.shape[0], bottom + pad)
    face_left = max(0, left - pad)
    face_right = min(gray.shape[1], right + pad)
    face_gray = gray[face_top:face_bottom, face_left:face_right]

    # ── Sharpness / Blur Detection ──────────────────────────────────
    sharpness = _compute_sharpness(face_gray)
    result["sharpness"] = round(sharpness, 2)

    if sharpness < MIN_FACE_SHARPNESS:
        issues.append(
            f"Image is too blurry (sharpness: {sharpness:.1f}, required: {MIN_FACE_SHARPNESS}). "
            "Please upload a sharper, in-focus photo."
        )

    # ── Brightness Check ────────────────────────────────────────────
    brightness = _compute_brightness(face_gray)
    result["brightness"] = round(brightness, 2)

    if brightness < MIN_BRIGHTNESS:
        issues.append(
            f"Image is too dark (brightness: {brightness:.0f}). "
            "Please upload a well-lit photo."
        )
    elif brightness > MAX_BRIGHTNESS:
        warnings.append(
            f"Image may be overexposed (brightness: {brightness:.0f}). "
            "Consider using a photo with more balanced lighting."
        )

    # ── Anti-Spoofing Heuristic ─────────────────────────────────────
    if ANTI_SPOOF_ENABLED:
        lbp_var = _compute_lbp_variance(face_gray)
        result["lbp_variance"] = round(lbp_var, 2)

        if lbp_var < ANTI_SPOOF_LBP_THRESHOLD:
            warnings.append(
                "Low facial texture complexity detected. "
                "This may indicate a printed photo or screen capture. "
                "For best results, use a live photo."
            )

    # ── Face Encoding Test ──────────────────────────────────────────
    # Verify we can actually generate an encoding from this image
    try:
        encodings = face_recognition.face_encodings(img_rgb, [face_locations[0]])
        if len(encodings) == 0:
            issues.append(
                "Could not generate face encoding. "
                "The face may be partially obscured. Please upload a clearer photo."
            )
    except Exception:
        issues.append("Face encoding generation failed. Please try a different photo.")

    # ── Final Verdict ───────────────────────────────────────────────
    result["valid"] = len(issues) == 0
    return result


def preprocess_image(image_path, max_dimension=None):
    """
    Preprocess an image for face recognition:
    1. Resize if too large
    2. Apply CLAHE histogram equalization for lighting normalization
    
    Args:
        image_path: Path to the image file
        max_dimension: Max dimension for resizing (uses config default if None)
    
    Returns:
        numpy array: Preprocessed RGB image ready for face_recognition
    """
    from app.config import MAX_IMAGE_DIMENSION, ENABLE_CLAHE, CLAHE_CLIP_LIMIT, CLAHE_TILE_GRID_SIZE

    if max_dimension is None:
        max_dimension = MAX_IMAGE_DIMENSION

    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    # ── Resize if too large ─────────────────────────────────────────
    h, w = img.shape[:2]
    if max(h, w) > max_dimension:
        scale = max_dimension / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # ── CLAHE Histogram Equalization ────────────────────────────────
    if ENABLE_CLAHE:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        clahe = cv2.createCLAHE(
            clipLimit=CLAHE_CLIP_LIMIT,
            tileGridSize=CLAHE_TILE_GRID_SIZE
        )
        l_channel = clahe.apply(l_channel)
        
        lab = cv2.merge([l_channel, a_channel, b_channel])
        img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    # Convert to RGB for face_recognition
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return img_rgb
