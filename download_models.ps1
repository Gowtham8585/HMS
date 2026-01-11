$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
)

$dest = "public\models"
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Force -Path $dest }

foreach ($f in $files) {
    $out = Join-Path $dest $f
    Write-Host "Downloading $f..."
    Invoke-WebRequest -Uri "$baseUrl/$f" -OutFile $out
}
Write-Host "Models downloaded successfully!"
