# Graph for initial view
| Endpoint | Description | Access Rights |
|---|---|---|
| GET /graph/all | Retrieves the entire set of nodes and links for the whole network | User |
| GET /graph/all/me | Retrieves the network of nodes and links closely related to the current user (nodes between 1 to 2 hops away, inclusive) | User |

## `GET /graph/all`
Retrieves the entire set of nodes and links for the whole network.

### Access Rights
User

### Parameters required
| Request Property |  Name  |   Type   |           Description           |
|------------------|--------|----------|---------------------------------|
|     req.user     |  User  |  Object  |  Available after user logs in.  |

### Example response
```json
{
 "nodes": [
           {
            "id": "129",
            "name": "test",
            "type": "module"
           },
           {
            "id": "77",
            "name": "user",
            "type": "user"
           }
          ],
 "links": [
           {
            "source": "129",
            "target": "77"
           }
          ]
}
```

#### Description of response
* `nodes` and `links` do not contain much data since we do not need the details when drawing the graph and for security purposes
* `node`
  * `node` represents a `node` and only consists of `id`, `name`, and `type`
  * `id` is the `id` of the node in the Neo4j db
  * `name` is the `name`
  * `type` can be: `module`, `user`, `contribution`, `post`
* `link`
  * `link` represents a relationship and only consists of `source` and `target`, where `source` and `target` refer to the `id` of the corresponding `node` in this relationship


## `GET /graph/all/me`
Retrieves the network of nodes and links closely related to the current user (nodes between 1 to 2 hops away, inclusive).

### Access Rights
User

### Parameters required
|    Request Property    |     Name    |   Type   |           Description           |
|------------------------|-------------|----------|---------------------------------|
|           req.user     |     User    |  Object  |  Available after user logs in.  |

### Example response
```json
{
 "nodes": [
           {
            "id": "129",
            "name": "test",
            "type": "module"
           },
           {
            "id": "77",
            "name": "user",
            "type": "user"
           }
          ],
 "links": [
           {
            "source": "129",
            "target": "77",
            "name": "MEMBER"
           }
          ]
}
```

#### Description of response
* `nodes` and `links` do not contain much data since we do not need the details when drawing the graph and for security purposes
* `node`
  * `node` represents a `node` and only consists of `id`, `name`, and `type`
  * `id` is the `id` of the node in the Neo4j db
  * `name` is the `name`
  * `type` can be: `module`, `user`, `contribution`, `post`
* `link`
  * `link` represents a relationship and consists of `source`, `target` and `name`
  * `source` and `target` refer to the `id` of the corresponding `node` in this relationship
  * `name` refers to the `name` of the relationship between the two `nodes`