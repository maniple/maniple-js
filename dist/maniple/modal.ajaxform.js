define(["jquery","./maniple.core","./maniple.modal"],function(a,b,c){function d(b){return{id:"submit",label:b.submitLabel,action:function(c){var d=a(this);return d.hasClass(b.disabledClass)?!1:(c.setStatus(b.submitStatus),setTimeout(function(){c.getContentElement().find("form").submit()},10),!1)},className:b.submitClass}}function e(a){return{id:"cancel",label:a.cancelLabel,action:"close",className:a.cancelClass}}function f(a,b,c){return b.getButton("submit").addClass(c.disabledClass),c.ajax.transport({type:c.method||a.attr("method")||"post",url:c.url||a.attr("action"),data:a.serialize(),success:function(a){b.getButton("submit").removeClass(c.disabledClass),b.setStatus(""),"function"==typeof c.complete&&c.complete(b,a)},error:function(a){b.getButton("submit").removeClass(c.disabledClass),"error"!==a.status?(con="string"==typeof a?a:a.data||a.html,g(b,con,c),b.setStatus(a.message)):b.setStatus(a.message,"error")},complete:function(){}}),!1}function g(b,c,d){c instanceof a||(c=a("<div/>").append(c).contents());var e=c.find("form").andSelf().filter("form");e.find("[name=submit]").attr("name","_submit"),e.submit(function(){return f(e,b,d),!1}),b.setContent(c);var g=!1,h=function(){try{return this.focus(),g=!0,!1}catch(a){}};e.find("[autofocus]").each(h),g||e.find("input:visible, textarea:visible, select:visible").each(h),e.on("keydown","input",function(a){return 13===a.keyCode?(e.submit(),!1):void 0})}function h(b){var f;return b=a.extend(!0,{},h.defaults,b),f=b.content,b.content=function(c){c.addClass(b.loadingClass),c.setButtons([e(b)]),b.ajax.transport({url:b.url,type:"get",success:function(h){var i;i="function"==typeof f?f(c,h):a("string"==typeof h?h:h.data||h.html),g(c,i,b),c.removeClass(b.loadingClass),c.setButtons([d(b),e(b)]),c.setStatus(""),"function"==typeof b.load&&b.load(c)},error:function(a){c.removeClass(b.loadingClass),c.setButtons([e(b)]),c.setStatus(a.message,"error")}})},new c(b).open()}return h.defaults={submitLabel:"Submit",submitClass:"btn btn-primary",submitStatus:"Sending form, please wait...",cancelLabel:"Cancel",cancelClass:"btn",loadingClass:"loading",disabledClass:"disabled",ajax:{transport:b.ajax}},h});