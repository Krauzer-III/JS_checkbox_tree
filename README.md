# Tree Select Kit

A compact dependency-free **CheckboxTree** and **RadioTree** for plain JS and ASP.NET Core MVC.

The original `checkbox-tree.js`, `checkbox-tree.css`, `index.html` remain unchanged for compatibility. The new components live in `dist/`.

## Demo

Open [demo/index.html](demo/index.html) directly in a browser. Run `npm test` for source smoke tests, or open [tests/browser-tests.html](tests/browser-tests.html) for interaction assertions.

## Quick start

```html
<link rel="stylesheet" href="/dist/tree-select.css">
<form method="post">
  <div id="checks"></div>
  <div id="radios"></div>
  <button type="submit">Сохранить</button>
</form>
<script src="/dist/tree-select.js"></script>
<script>
const data = [
  { ID:1, ParentID:null, MaterialObjectTypeName:"Мебель" },
  { ID:2, ParentID:1, MaterialObjectTypeName:"Стулья" },
  { ID:3, ParentID:2, MaterialObjectTypeName:"Кресло" }
];
new CheckboxTree("#checks", { data, name:"CategoryIds" });
new RadioTree("#radios", { data, name:"SelectedCategoryId" });
</script>
```

**Behavior**: Each parent is selectable as its own item. The separate **☑** button on parent rows selects/deselects only descendants. Search shows complete paths (Мебель → Стулья → Кресло) and does not discard selections made across different searches. Selected inputs stay present in the DOM (including when hidden by search) and post under their configured `name`.

## ASP.NET Core MVC (.NET 8) sample

```bash
cd samples/AspNetCoreMvc
dotnet run
```

Open the displayed localhost URL. The sample ships with pre-copied files in `wwwroot/lib/tree-select/` and an optional `TreeSelectTagHelper`.

Razor usage:

```razor
<tree-select items="Model.Nodes" name="CategoryIds" mode="checkbox" selected-values="Model.CategoryIds" />
<tree-select items="Model.Nodes" name="SelectedCategoryId" mode="radio" value="Model.SelectedCategoryId" />
```

Controller model:

```csharp
public List<int> CategoryIds { get; set; } = new();
public int? SelectedCategoryId { get; set; }
```

## API

`CheckboxTree` and `RadioTree` constructors accept a selector/element and options: `data`, `name`, `selectedIds`, `value`, `idKey`, `textKey`, `parentKey`, `childrenKey`, `search`, `searchPlaceholder`, `onChange`.

Methods: `getSelected()`, `getSelectedIds()`, `getManuallySelected()`, `setSelected()`, `setChecked(ids, checked, {cascade,manual})` (checkbox), `selectBranch(id, checked)` (checkbox), `checkAll(checked)` (checkbox), `clear()`, `setSearch(text)`, `expandAll()`, `collapseAll()`, `setData(data)`, and `destroy()`.

No Bootstrap or jQuery required.

**Note:** Client-side selected IDs should always be validated against permitted values on the server.
