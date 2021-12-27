# Repository

## 1. Concept
The repository should fulfil the following requirements:
- flexible, extendible schema


## 1. Layers
- Container
- Data manager
- Entity manager

## 2.1. Container
- implements CRUD
- supports seek: retrieve/store uses offset
- no support for types

### 2.2. Functions
- create(): create a new empty container
- read(offset, length): read length bytes from a container at a given offset
- update(bytes, offset, length): write length bytes into a container at a given offset
- delete(id): delete a container

---

## 3.1. Data manager
- uses tables that store datasets of types defined by schema
- supports indexing on selected data items
- supports views defined as queries
- supports keys and foreign keys
- no support for references

### 3.2. Functions
- addType(typeDef): add a type to the schema
- addIndex(indexDef): add indexing to an attribute of a type
- addKey(keyDef): set an attribute as key or foreign key of a type, keys can be manual or automatic (auto=true)
- addQuery(queryDef): define a query; fields can be standard attributes, keys or expressions
- addSchema(schema): add types, indices and keys and queries
- getByAttribute(type, attribute, value): retrieve dataset or list of datasets selected by attribute = value
- runQuery(query): execute the given query and return the list of selected datasets

---

## 4.1. Entity manager
- entities are logical objects using methods and references
- entities are defined as complex types
- an entity type must have an underlying data object (data type or query)
- entity attributes are filled from data type attribute or calculated
- calculated values can be references or expressions

### 4.2. Functions
- addType: add an entity type to the schema
- create: create an entity of a type as blank or from data, key is assigned manually or automatically
- read: read an entity selected by its key attribute, resolve any calculated attributes
- update: update an entity selected by its key attribute
- delete: delete an entity selected by its key attribute

---

## 5. Example
System stores items and users, users can have multiple items.

### 5.1. Data sets
```json
DataTypes = [
  { "name":"dbid", "type":"int", "min":0, "max":999999 },
  { "name":"dblist", "type":"list", "elemType":"dbid" },
  { "name":"dbItem",
    "attributes": {
      "id": { "type":"dbid" },
      "name": { "type":"string" },
      "owner": { "type":"dbid" }
    }
  },
  { "name":"User",
    "attributes": {
      "id": { "type":"dbid" },
      "name": { "type":"string" },
      "items": { "type":"dblist" }
    }
  }
];
```

Queries
```sql
- db.GetUserItems(dbid owner) = "SELECT id FROM dbItem WHERE owner=$owner";
```

### 5.2. Entities
```json
EntityTypes = [
  { "name":"ItemList", "type":"list", "elemType":"ref Item" },
  { "name":"Item", "data":"dbItem",
    "attributes": {
      "id": { "type":"dbid" },
      "name": { "type":"string" },
      "owner": { "type":"ref User" }
    }
  },
  { "name":"User", "source":"dbUser",
    "attributes": {
      "id": { "type":"dbid" },
      "name": { "type":"string" },
      "items": { "type":"ItemList", "source":"db.GetUserItems($id)" }
    }
  }
];
```