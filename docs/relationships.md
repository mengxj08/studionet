# Relationships
| Endpoint | Description | Access Rights |
|---|---|---|
| POST /api/relationships | Create a relationship between two nodes of the specified type | User 


## `POST /api/relationships`
Create a relationship between two nodes of the specified type.

### Access Rights
User

### Parameters required
|    Request Property    |     Name    |   Type   |           Description           |
|------------------------|-------------|----------|---------------------------------|
|           req.user     |     User    |  Object  |  Available after user logs in.  |
| req.body.source | Source | String | The source for the relationship to create. |
| req.body.target | Target | String | The target for the relationship to create. |
| req.body.relationshipName | Relationship Name | String | The 'type' of relationship to create. Ensure that this type matches the existing format in the database. |

### Example response
```
None
```