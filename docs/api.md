# API Documentation

##### Last updated: 10 Oct 2016

### Routes List
|      Route      |      Resource     | 
| --------------  | ----------------- | 
|    [/graph/all](../docs/graph_all.md)   | Graph for initial view |
| [/graph/med](../docs/graph_med.md) | Graph for medium detail view |
|   [/api/profile](../docs/profile.md) |    User Profile   |
|   [/api/modules](../docs/modules.md)  |      Modules      | 
| /api/contributions | Contributions |
| [/api/relationships](../docs/relationships.md) | Relationships |
|    [/api/users](../docs/users.md)   |       Users       |
| /api/moderators |     Moderators    |
|     [/uploads](../docs/uploads.md)    |      Uploads      |


### Graph for initial view
| Endpoint | Description | Access Rights |
|---|---|---|
| GET /graph/all | Retrieves the entire set of nodes and links for the whole network | User |
| GET /graph/all/me | Retrieves the network of nodes and links closely related to the current user (nodes between 1 to 2 hops away, inclusive) | User |


### Graph for medium detail view
| Endpoint | Description | Access Rights |
|---|---|---|
| GET /graph/med | Retrieves the network of nodes and links related to the current user, at least 1 hop away. Maximum distance is specified by query parameter (distance). Default maximum is 2 hops. | User |


### User Profile
|          Endpoint          |                             Description                            |  Access Rights  |
|----------------------------|--------------------------------------------------------------------|-----------------|
|       GET /api/profile     |    Retrieves the current user's profile and modules information    |      User       |
|      _PUT /api/profile_      |              _Update information about the current user_             |      _User_      |
|    GET /api/profile/user   |          Retrieves the current user's profile information          |      User       |
|  GET /api/profile/modules  |            Retrieves all modules the current user is in            |      User       |

### Modules
|             Endpoint             |                            Description                           |  Access Rights  |
|----------------------------------|------------------------------------------------------------------|-----------------|
|         GET /api/modules         |    Get a list of all modules with basic information about each   |      User       |
|         POST /api/modules        |                          Add a new module                        |   Super Admin   |
|    GET /api/modules/:moduleId    |       Get a specific module with basic information about it      |      User       |
|    PUT /api/modules/:moduleId    |                      Update a specific module                    |    Moderator    |
|  DELETE /api/modules/:moduleId   |                      Delete a specific module                    |   Super Admin   |
| GET /api/modules/:moduleId/users |         Get all users that are part of a specific module.        |      User       |

### Contributions

### Relationships
| Endpoint | Description | Access Rights |
|---|---|---|
| POST /api/relationships | Create a relationship between two nodes of the specified type | User |

### Users
|         Endpoint          |                         Description                         | Access Rights |
|---------------------------|-------------------------------------------------------------|---------------|
|      GET /api/users       |  Get a list of all users with basic information about each  |  Super Admin  |
|      POST /api/users      |       Add a new user not associated with any modules        |  Super Admin  |
|  GET /api/users/:userId   |         Get a specific user with basic information          |  Super Admin  |
|  PUT /api/users/:userId   |                    Update a specific user                   |  Super Admin  |
| DELETE /api/users/:userId |                    Delete a specific user                   |  Super Admin  |

### Moderators

### Uploads
|                  Endpoint                 |                           Description                          | Access Rights |
|-------------------------------------------|----------------------------------------------------------------|---------------|
|            POST /uploads/avatar           |            Upload a new avatar for the current user            |      User     |
|           POST /uploads/models            |            Upload a new model under the current user           |      User     |
|      GET /uploads/:nusOpenId/avatar       |                  Get a specific user's avatar                  |      User     |
|      GET /uploads/:nusOpenId/models       |  Get information about all models uploaded by a specific user  |      User     |
|  GET /uploads/:nusOpenId/models/:modelId  |      Download a specific model uploaded by a certain user      |      User     |