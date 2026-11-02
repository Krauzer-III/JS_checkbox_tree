namespace TreeSelect.MvcDemo.Models;
public sealed class TreeDemoViewModel {
 public List<TreeNodeItem> Nodes { get; set; } = new();
 public List<int> CategoryIds { get; set; } = new();
 public int? SelectedCategoryId { get; set; }
 public bool IsPosted { get; set; }
}
