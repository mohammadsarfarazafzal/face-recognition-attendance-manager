# backend/app/config.py — Centralized configuration for face recognition system

import os
from dotenv import load_dotenv

load_dotenv()

# =============================================================================
# DATABASE
# =============================================================================
SQLALCHEMY_DATABASE_URI = os.getenv(
    'DATABASE_URI',
    'mysql+pymysql://root:root@localhost/attendance_db'
)

# =============================================================================
# FACE RECOGNITION THRESHOLDS
# =============================================================================

# Primary recognition threshold — faces with distance ABOVE this are rejected as "Unknown"
# Lower = stricter (fewer false positives, more unknowns)
# Higher = more lenient (more matches, risk of false positives)
# Library default is 0.6 — we use 0.42 for production reliability
RECOGNITION_DISTANCE_THRESHOLD = 0.42

# High-confidence threshold — matches below this distance are considered very reliable
# Used for logging/classification, not for accept/reject decisions
RECOGNITION_HIGH_CONFIDENCE_THRESHOLD = 0.35

# =============================================================================
# FACE QUALITY VALIDATION (Registration)
# =============================================================================

# Minimum face bounding box dimension (width or height) in pixels
# Faces smaller than this are too low-resolution for reliable encoding
MIN_FACE_SIZE = 80

# Blur detection — Laplacian variance threshold
# Higher = sharper image required. Below this → "image too blurry"
# Typical: 50-100 for moderate quality, 100+ for strict
MIN_FACE_SHARPNESS = 50.0

# Brightness range (0-255 mean pixel value)
# Below MIN → too dark, Above MAX → overexposed
MIN_BRIGHTNESS = 40
MAX_BRIGHTNESS = 220

# =============================================================================
# ANTI-SPOOFING (Basic Heuristic)
# =============================================================================

# LBP (Local Binary Pattern) texture variance threshold
# Real faces have higher texture variance than printed photos / screens
# Set conservatively — this is a heuristic, not a guarantee
ANTI_SPOOF_LBP_THRESHOLD = 15.0

# Enable/disable anti-spoofing check
ANTI_SPOOF_ENABLED = True

# =============================================================================
# IMAGE PREPROCESSING
# =============================================================================

# Maximum image dimension before resizing (longest edge)
# Larger images are resized to this before processing to improve speed
MAX_IMAGE_DIMENSION = 1920

# Enable CLAHE histogram equalization for lighting normalization
ENABLE_CLAHE = True

# CLAHE parameters
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID_SIZE = (8, 8)

# =============================================================================
# LOGGING
# =============================================================================

# Enable detailed recognition logging to database
RECOGNITION_LOGGING_ENABLED = True

# =============================================================================
# CORS / DEPLOYMENT
# =============================================================================
FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
