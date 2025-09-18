// Validation middleware for request data
export const validateGroupCreate = (req, res, next) => {
  const { name, description } = req.body;
  
  // Validate name (required, non-empty string)
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Group name is required and cannot be empty'
    });
  }
  
  // Validate description (optional, but if provided must be string)
  if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'Group description cannot be empty if provided'
    });
  }
  
  // Trim whitespace and update request body
  req.body.name = name.trim();
  if (description !== undefined) {
    req.body.description = description.trim();
  }
  
  next();
};

export const validateGroupUpdate = (req, res, next) => {
  const { name, description } = req.body;
  
  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Group name cannot be empty'
      });
    }
    req.body.name = name.trim();
  }
  
  // Validate description if provided
  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Group description cannot be empty if provided'
      });
    }
    req.body.description = description.trim();
  }
  
  next();
};

export const validatePostCreate = (req, res, next) => {
  const { title, abstract } = req.body;
  
  // Validate title (required, non-empty string)
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Post title is required and cannot be empty'
    });
  }
  
  // Validate abstract (optional, but if provided must be string)
  if (abstract !== undefined && (typeof abstract !== 'string' || abstract.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'Post abstract cannot be empty if provided'
    });
  }
  
  // Trim whitespace and update request body
  req.body.title = title.trim();
  if (abstract !== undefined) {
    req.body.abstract = abstract.trim();
  }
  
  next();
};

export const validatePostUpdate = (req, res, next) => {
  const { title, abstract } = req.body;
  
  // Validate title if provided
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Post title cannot be empty'
      });
    }
    req.body.title = title.trim();
  }
  
  // Validate abstract if provided
  if (abstract !== undefined) {
    if (typeof abstract !== 'string' || abstract.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Post abstract cannot be empty if provided'
      });
    }
    req.body.abstract = abstract.trim();
  }
  
  next();
};
