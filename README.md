For now it's just a simple way to inject `postcss` plugins.

In the future it might become a full-blown module to define extensions for Create React App.

```js
{
  // ...
  "devDependencies": {
    // ...
    "postcss-calc": "7.0.1",
    "postcss-custom-properties": "8.0.9",
    "postcss-import": "12.0.1",
    "react-scripts": "3.0.0",
    "react-scripts-x": "1.0.0",
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

# Changelog

## 1.0.0 (April 26, 2019)

Fixed for `react-scripts` >= 3. Continue using `react-scripts-x@0.1.3` for `react-scripts` < 3.
