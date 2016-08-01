# API Documentation

### Routes List
|      Route      |      Resource     | 
| --------------  | ----------------- | 
|   /api/profile  |    User Profile   |
|   /api/modules  |      Modules      | 
|    /api/users   |       Users       |
| /api/moderators |     Moderators    |
|     /uploads    |      Uploads      |

### User Profile
|          Endpoint          |                             Description                            |  Access Rights  |
|----------------------------|--------------------------------------------------------------------|-----------------|
|       GET /api/profile     |    Retrieves the current user's profile and modules information    |      User       |
|    GET /api/profile/user   |          Retrieves the current user's profile information          |      User       |
|  GET /api/profile/modules  |            Retrieves all modules the current user is in            |      User       |

### Modules
|          Endpoint          |                            Description                           |  Access Rights  |
|----------------------------|------------------------------------------------------------------|-----------------|
|      GET /api/modules      |    Get a list of all modules with basic information about each   |      User       |
|      POST /api/modules     |                          Add a new module                        |      User       |
|    GET /api/modules/:id    |       Get a specific module with basic information about it      |      User       |
|    PUT /api/modules/:id    |                      Update a specific module                    |      User       |
|  DELETE /api/modules/:id   |                      Delete a specific module                    |      User       |
| GET /api/modules/:id/users |       Get a specific module with basic information about it      |      User       |