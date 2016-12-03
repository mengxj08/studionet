# User Profile
|          Endpoint          |                             Description                            |  Access Rights  |
|----------------------------|--------------------------------------------------------------------|-----------------|
|       GET /api/profile     |    Retrieves the current user's profile and modules information    |      User       |
|      _PUT /api/profile_      |              _Update information about the current user_             |      _User_       |
|    GET /api/profile/user   |          Retrieves the current user's profile information          |      User       |
|  GET /api/profile/modules  |            Retrieves all modules the current user is in            |      User       |

## `GET /api/profile`
Retrieves the current user's profile and modules information.

### Access Rights
User

### Parameters required
| Request Property |  Name  |   Type   |           Description           |
|------------------|--------|----------|---------------------------------|
|     req.user     |  User  |  Object  |  Available after user logs in.  |

### Example response
```json
{
  "canEdit": true,
  "name": "User",
  "avatar": "/uploads/E123456/avatar",
  "nusOpenId": "E123456",
  "year": 2,
  "id":87,
  "modules": [{
                "name": "qweq",
                "role": "Admin",
                "contributionTypes": ["weqwe","wew","eqw"],
                "code": "weqeqwe",
                "id": 129
              },
              {
                "name": "test",
                "role": "Admin",
                "contributionTypes": ["test"],
                "code": "test",
                "id": 121
              }],
  "lastLoggedIn": 1470033863980,
  "superAdmin":true
}
```


## `PUT /api/profile`
Update information about the current user.
**`This route is currently under reevaluation and is not under use`**

### Access Rights
User

### Parameters required
|   Request Property   |     Name     |    Type   |                                Description                                |
|----------------------|--------------|-----------|---------------------------------------------------------------------------|
|       req.user       |     User     |   Object  |                       Available after user logs in.                       |
|     req.body.name    |     Name     |   String  |                         Name of user to be added.                         |
|  req.body.nusOpenId  |  NUS OpenID  |   String  |                      OpenID of the user to be added.                      |
|   req.body.canEdit   |  Allow Edit  |  Boolean  |                         Allow this user to edit.                          |
|     req.body.year    |     Year     |   Number  |  Year of study for the current user. Can be any number if not a student.  |

### Example response
```json
{
  "year": 2,
  "nusOpenId": "E123456",
  "canEdit": true,
  "name": "User",
  "lastLoggedIn": 1470033863980,
  "avatar": "/uploads/E123456/avatar",
  "superAdmin": false
}
```

## `GET /api/profile/user`
Retrieves the current user's profile information.

### Access Rights
User

### Parameters required
| Request Property |  Name  |   Type   |           Description           |
|------------------|--------|----------|---------------------------------|
|     req.user     |  User  |  Object  |  Available after user logs in.  |

### Example response
```json
{ 
  "year": 2,
  "nusOpenId": "E123456",
  "canEdit": true,
  "name": "User",
  "lastLoggedIn": 1469442573896,
  "avatar": "/uploads/E123456/avatar",
  "superAdmin": true,
  "id": 87
}
```

## `GET /api/profile/modules`
Retrieves all the modules (and the role of the user in the module) the current user is in.

### Access Rights
User

### Parameters required
| Request Property |  Name  |   Type   |           Description           |
|------------------|--------|----------|---------------------------------|
|     req.user     |  User  |  Object  |  Available after user logs in.  |

### Example response
```json
[{
  "name": "qweq",
  "role": "Admin",
  "contributionTypes": ["weqwe","wew","eqw"],
  "code": "weqeqwe",
  "id": 129
 },
 {
  "name": "test",
  "role": "Admin",
  "contributionTypes":["test"],
  "code": "test",
  "id": 121
}]
```
