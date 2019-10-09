# 如何使用

```javascript
  
  <div> 
    <div r-for={(item,index) in arr}>
    </div>   
</div>


```

# 效果
```javascript
React.createElement("div", null, Array.from(arr).map(((item, index) => {
  return React.createElement("div", null);
}).bind(this))); 
```