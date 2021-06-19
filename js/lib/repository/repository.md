# Repository

## 1. Layers
- Container
- Data manager
- Entity manager

## 2.1. Container
- container implements CRUD
- retrieve/store data using offsets
- no support for types

### 2.2. Functions
- create: create a new empty container
- read: read length bytes from a container at a given offset
- update: write length bytes into a container at a given offset
- delete: delete a container

## 3.1. Data manager
- uses tables that are data types defined by schema
- indexing on selected data items
- uses views defined as queries
- does not support references only keys and foreign keys

### 3.2. Functions
- addType: add a type to the schema
- addIndex: add indexing to an attribute of a type
- addKey: set an attribute as key or foreign key of a type, keys can be manual or automatic (auto=true)
- addQuery: define a query; fields can be standard attributes, keys or expressions
- addSchema: add types, indices and keys and queries

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

## 5. Example
System stores items and users, users can have multiple items.

### 5.1. Data sets
DataTypes = [
  { "name":"dbid", "type":"int", "min":0, "max":999999 },
  { "name":"dblist", "type":"list", "elemType":"dbid" },
  { "name":"dbItem",
    "attributes": [
      { "name":"id", "type":"dbid" },
      { "name":"name", "type":"string" },
      { "name":"owner", "type":"dbid" }
    ]
  },
  { "name":"User",
    "attributes": [
      { "name":"id", "type":"dbid" },
      { "name":"name", "type":"string" },
      { "name":"items", "type":"dblist" }
    ]
  }
];

Queries
- db.GetUserItems(dbid owner) = "SELECT id FROM dbItem WHERE owner=$owner";

### 5.2. Entities
EntityTypes = [
  { "name":"ItemList", "type":"list", "elemType":"ref Item" },
  { "name":"Item", "data":"dbItem"
    "attributes": [
      { "name":"id", "type":"dbid" },
      { "name":"name", "type":"string" },
      { "name":"owner", "type":"ref User" }
    ]
  },
  { "name":"User", "source":"dbUser",
    "attributes": [
      { "name":"id", "type":"dbid" },
      { "name":"name", "type":"string" },
      { "name":"items", "type":"ItemList", "source":"db.GetUserItems($id)" }
    ]
  }
];
