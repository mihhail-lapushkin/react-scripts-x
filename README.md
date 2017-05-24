For now it's just a simple way to inject `postcss` plugins.

In the future it might become a full-blown module to define extensions for Create React App.

```js
{
  // ...
  "devDependencies": {
    // ...
    "postcss-calc": "6.0.0",
    "postcss-custom-properties": "6.0.1",
    "postcss-import": "10.0.0",
    "react-scripts": "1.0.2",
    "react-scripts-x": "0.1.2",
    // ...
  },
  // ...
  "react-scripts-x": {
    "postcss": [
      {
        "name": "postcss-import"
      },
      {
        "name": "postcss-custom-properties",
        "config": {
          "preserve": true
        }
      },
      {
        "name": "postcss-calc"
      }
    ]
  },
  "scripts": {
    "start": "react-scripts-x start",
    "test": "react-scripts-x test",
    "build": "react-scripts-x build"
  }
}
```
