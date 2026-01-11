import * as faceapi from 'face-api.js';

export const loadModels = async () => {
    const MODEL_URL = '/models';
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        // faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL) // Heavier but more accurate
    ]);
};

export const getFaceDescriptor = async (videoElement) => {
    const detection = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return null;
    return detection.descriptor;
};

export const createMatcher = (labeledDescriptors) => {
    return new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is distance threshold
};
