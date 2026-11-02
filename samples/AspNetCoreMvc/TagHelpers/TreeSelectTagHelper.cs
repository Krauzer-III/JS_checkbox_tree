using System.Text.Json;
using Microsoft.AspNetCore.Razor.TagHelpers;
using TreeSelect.MvcDemo.Models;
namespace TreeSelect.MvcDemo.TagHelpers;
[HtmlTargetElement("tree-select",Attributes="items,name")]
public sealed class TreeSelectTagHelper:TagHelper {
 [HtmlAttributeName("id")]public string? Id {get;set;}
 [HtmlAttributeName("name")]public string Name {get;set;}="";
 [HtmlAttributeName("items")]public IEnumerable<TreeNodeItem> Items {get;set;}=Array.Empty<TreeNodeItem>();
 [HtmlAttributeName("mode")]public string Mode {get;set;}="checkbox";
 [HtmlAttributeName("selected-values")]public IEnumerable<int> SelectedValues {get;set;}=Array.Empty<int>();
 [HtmlAttributeName("value")]public int? Value {get;set;}
 [HtmlAttributeName("search")]public bool Search {get;set;}=true;
 public override void Process(TagHelperContext context,TagHelperOutput output) {
 if(string.IsNullOrWhiteSpace(Name))throw new ArgumentException("name is required");
 var id=string.IsNullOrWhiteSpace(Id)?"tree-"+Guid.NewGuid().ToString("N"):Id;
 output.TagName="div";output.TagMode=TagMode.StartTagAndEndTag;output.Attributes.SetAttribute("id",id);
 var args=JsonSerializer.Serialize(new {data=Items,name=Name,selectedIds=SelectedValues,value=Value,search=Search});
 var ctor=Mode.Equals("radio",StringComparison.OrdinalIgnoreCase)?"RadioTree":"CheckboxTree";
 output.PostElement.AppendHtml("<script>document.addEventListener('DOMContentLoaded',function(){new window."+ctor+"(document.getElementById("+JsonSerializer.Serialize(id)+"),"+args+");});</script>");
 }
}
