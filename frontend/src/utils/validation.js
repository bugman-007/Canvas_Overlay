export const validateVideo = (file) => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 100MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only video files (MP4, AVI, MOV, WMV) are allowed' };
    }
    
    return { valid: true };
  };
  
  export const validateAnnotations = (annotations) => {
    if (!Array.isArray(annotations)) {
      return { valid: false, error: 'Annotations must be an array' };
    }
    
    if (annotations.length === 0) {
      return { valid: false, error: 'At least one annotation is required' };
    }
    
    for (const annotation of annotations) {
      if (!annotation.timestamp || !annotation.canvasData) {
        return { valid: false, error: 'Invalid annotation data' };
      }
    }
    
    return { valid: true };
  };