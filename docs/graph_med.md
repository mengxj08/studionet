# Graph for medium detail view
| Endpoint | Description | Access Rights |
|---|---|---|
| GET /graph/med | Retrieves the network of nodes and links related to the current user, at least 1 hop away. Maximum distance is specified by query parameter (distance). Default maximum is 2 hops. | User |


## `GET /graph/med`
Retrieves the network of nodes and links related to the current user, at least 1 hop away. Maximum distance is specified by query parameter (distance). Default maximum is 2 hops.

### Access Rights
User

### Parameters required
|    Request Property    |     Name    |   Type   |           Description           |
|------------------------|-------------|----------|---------------------------------|
|           req.user     |     User    |  Object  |  Available after user logs in.  |
| req.query.distance | Distance | String | **_Optional_** query parameter to specify maximum distance from the current user's node to return. By default, maximum is 2 hops.|

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