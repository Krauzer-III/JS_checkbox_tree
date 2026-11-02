using Microsoft.AspNetCore.Mvc;
using TreeSelect.MvcDemo.Models;
namespace TreeSelect.MvcDemo.Controllers;
public sealed class TreeDemoController:Controller {
 static readonly List<TreeNodeItem> Nodes = new() {
 new(1,"Мебель",null),new(2,"Стулья",1),new(3,"Кресло",2),
 new(4,"Офисный стул",2),new(5,"Столы",1),new(6,"Письменный стол",5),
 new(7,"Освещение",null),new(8,"Лампы",7),new(9,"Настольная лампа",8)
 };
 [HttpGet] public IActionResult Index()=>View(new TreeDemoViewModel { Nodes=Nodes, CategoryIds=new(){4},SelectedCategoryId=3 });
 [HttpPost][ValidateAntiForgeryToken] public IActionResult Index(TreeDemoViewModel model) {
 var valid=Nodes.Select(n=>n.ID).ToHashSet();
 model.CategoryIds=model.CategoryIds.Where(valid.Contains).Distinct().ToList();
 if(model.SelectedCategoryId is int id&&!valid.Contains(id))model.SelectedCategoryId=null;
 model.Nodes=Nodes;model.IsPosted=true;return View(model);
 }
}
