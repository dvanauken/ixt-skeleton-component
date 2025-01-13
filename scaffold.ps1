# Create directory
New-Item -Path "src/lib/skeleton" -ItemType Directory -Force

# Create files
$files = @(
    "vector.ts",
    "angle.ts",
    "vertex.ts",
    "edge.ts",
    "event.ts",
    "edge-event.ts",
    "split-event.ts",
    "event-queue.ts",
    "polygon.ts",
    "wavefront.ts",
    "skeleton.ts"
)

foreach ($file in $files) {
    New-Item -Path "src/lib/skeleton/$file" -ItemType File -Force
}