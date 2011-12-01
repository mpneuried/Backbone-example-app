(function() {
  var Collection, Model, Router, View, name, src, _Config, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Model = Backbone.Model, Collection = Backbone.Collection, Router = Backbone.Router, View = Backbone.View;
  _Config = {
    dbpath: "http://localhost:3000/",
    dbname: "bb"
  };
  window.BB = {
    Models: {},
    TemplateSrc: {},
    Templates: {},
    Collections: {},
    Views: {},
    Main: null
  };
  BB.TemplateSrc = {
    list: '\
<a href="#contact/<%= _id %>"><%= name %></a>\
	',
    detail: '\
<form>\
  <fieldset>\
    <legend>Kontakt: <span class="name-out"><%= obj.name %></span></legend>\
    \
    <div class="clearfix">\
      <label for="contact_gender">Geschlecht</label>\
      <div class="input">\
        <select id="contact_gender" name="gender">\
          <option <% if( obj.gender === "m" ){ %>selected="selected" <% } %>>m</option>\
          <option <% if( obj.gender === "w" ){ %>selected="selected" <% } %>>w</option>\
        </select>\
      </div>\
    </div><!-- /clearfix -->\
\
    <div class="clearfix">\
      <label for="contact_name">Name</label>\
      <div class="input">\
        <input type="text" name="name" id="contact_name" value="<%= name %>">\
      </div>\
    </div><!-- /clearfix -->\
\
    <div class="clearfix">\
      <label for="contact_email">E-Mail</label>\
      <div class="input">\
        <input type="text" name="email" id="contact_email" value="<%= obj.email %>">\
      </div>\
    </div><!-- /clearfix -->\
    \
    <div class="actions">\
      <input type="button" value="Speichern" class="btn primary act-save">&nbsp;<a class="btn" href="#">Cancel</a><% if( obj._id ){ %>&nbsp;<a class="btn error" href="#delete/contact/<%= _id %>">löschen</a><% } %>\
    </div>\
  </fieldset>\
</form>\
	'
  };
  _ref = BB.TemplateSrc;
  for (name in _ref) {
    src = _ref[name];
    BB.Templates[name] = _.template(src);
  }
  BB.Models.Contact = (function() {
    __extends(Contact, Model);
    function Contact() {
      this.url = __bind(this.url, this);
      Contact.__super__.constructor.apply(this, arguments);
    }
    Contact.prototype.idAttribute = "_id";
    Contact.prototype.url = function() {
      return "" + _Config.dbpath + _Config.dbname + "/addressbook/" + (this.id || "");
    };
    return Contact;
  })();
  BB.Collections.Addressbook = (function() {
    __extends(Addressbook, Collection);
    function Addressbook() {
      Addressbook.__super__.constructor.apply(this, arguments);
    }
    Addressbook.prototype.model = BB.Models.Contact;
    Addressbook.prototype.url = "" + _Config.dbpath + _Config.dbname + "/addressbook/";
    return Addressbook;
  })();
  BB.Main = (function() {
    __extends(Main, Router);
    function Main() {
      this.addressbook = __bind(this.addressbook, this);
      this.contactDisplay = __bind(this.contactDisplay, this);
      this.contactDelete = __bind(this.contactDelete, this);
      this.contactEdit = __bind(this.contactEdit, this);
      this.contactCreate = __bind(this.contactCreate, this);
      this._bootstrap = __bind(this._bootstrap, this);
      this.initialize = __bind(this.initialize, this);
      Main.__super__.constructor.apply(this, arguments);
    }
    Main.prototype.routes = {
      "": "addressbook",
      "addressbook/": "addressbook",
      "contact/:id": "contactEdit",
      "create/contact": "contactCreate",
      "delete/contact/:id": "contactDelete"
    };
    Main.prototype.initialize = function() {
      this._collections = {
        addressbook: new BB.Collections.Addressbook()
      };
      this._bootstrap();
    };
    Main.prototype._bootstrap = function() {
      this._collections.addressbook.fetch({
        success: __bind(function() {
          return this.trigger("ready");
        }, this)
      });
    };
    Main.prototype.contactCreate = function() {
      var model;
      model = new this._collections.addressbook.model();
      this.contactDisplay(model);
    };
    Main.prototype.contactEdit = function(id) {
      var model;
      model = this._collections.addressbook.get(id);
      this.contactDisplay(model);
    };
    Main.prototype.contactDelete = function(id) {
      var model;
      model = this._collections.addressbook.get(id);
      if (model) {
        model.destroy({
          success: __bind(function() {
            return this.navigate("", false);
          }, this)
        });
      }
    };
    Main.prototype.contactDisplay = function(model) {
      var elTarget, view;
      elTarget = $("#modelTarget");
      view = new BB.Views.Contact.Form({
        router: this,
        model: model
      });
      elTarget.html(view.render().el);
    };
    Main.prototype.addressbook = function() {
      var elTarget, view;
      this.navigate("addressbook/", false);
      elTarget = $("#modelTarget").empty();
      elTarget = $("#collectionTarget");
      view = new BB.Views.Addressbook({
        router: this,
        collections: this._collections
      });
      elTarget.html(view.el);
    };
    return Main;
  })();
  BB.Views.Addressbook = (function() {
    __extends(Addressbook, View);
    function Addressbook() {
      this.render = __bind(this.render, this);
      this.addOne = __bind(this.addOne, this);
      this.initialize = __bind(this.initialize, this);
      Addressbook.__super__.constructor.apply(this, arguments);
    }
    Addressbook.prototype.tagName = "ul";
    Addressbook.prototype.initialize = function(options) {
      this.router = options.router;
      this.collections = options.collections;
      this.collections.addressbook.bind("reset", this.render);
      this.collections.addressbook.bind("add", this.addOne);
      return this;
    };
    Addressbook.prototype.addOne = function(contact) {
      var view;
      view = new BB.Views.Contact.List({
        router: this.app,
        model: contact
      });
      this.$(this.el).append(view.render().el);
    };
    Addressbook.prototype.render = function() {
      var views;
      views = [];
      this.collections.addressbook.each(__bind(function(contactModel) {
        var view;
        view = new BB.Views.Contact.List({
          router: this.app,
          model: contactModel
        });
        views.push(view.render().el);
      }, this));
      this.$(this.el).html(views);
      return this;
    };
    return Addressbook;
  })();
  BB.Views.Contact = {};
  BB.Views.Contact.List = (function() {
    __extends(List, View);
    function List() {
      this.render = __bind(this.render, this);
      this.remove = __bind(this.remove, this);
      this.initialize = __bind(this.initialize, this);
      List.__super__.constructor.apply(this, arguments);
    }
    List.prototype.tagName = "li";
    List.prototype.template = BB.Templates.list;
    List.prototype.initialize = function(options) {
      this.router = options.router;
      this.model.bind("change", this.render);
      this.model.bind("destroy", this.remove);
      return this;
    };
    List.prototype.remove = function() {
      this.$(this.el).remove();
    };
    List.prototype.render = function() {
      this.$(this.el).html(this.template(this.model.toJSON()));
      return this;
    };
    return List;
  })();
  BB.Views.Contact.Form = (function() {
    __extends(Form, View);
    function Form() {
      this.keyupName = __bind(this.keyupName, this);
      this.save = __bind(this.save, this);
      this.render = __bind(this.render, this);
      this.remove = __bind(this.remove, this);
      this.initialize = __bind(this.initialize, this);
      Form.__super__.constructor.apply(this, arguments);
    }
    Form.prototype.tagName = "div";
    Form.prototype.template = BB.Templates.detail;
    Form.prototype.events = {
      "click .act-save": "save",
      "keyup #contact_name": "keyupName"
    };
    Form.prototype.initialize = function(options) {
      this.router = options.router;
      this.model.bind("destroy", this.remove);
      this.model.bind("change", this.render);
      return this;
    };
    Form.prototype.remove = function() {
      this.$(this.el).remove();
    };
    Form.prototype.render = function() {
      this.$(this.el).html(this.template(this.model.toJSON()));
      return this;
    };
    Form.prototype.save = function() {
      var data, field, fields, isNew, _i, _len;
      fields = this.$("form").serializeArray();
      data = {};
      for (_i = 0, _len = fields.length; _i < _len; _i++) {
        field = fields[_i];
        data[field.name] = field.value;
      }
      isNew = true;
      if (!this.model.isNew()) {
        isNew = false;
        data._id = this.model.id;
      }
      return this.model.save(data, {
        success: __bind(function(contact) {
          if (isNew) {
            this.router._collections.addressbook.add(this.model);
            return this.router.navigate("contact/" + this.model.id, false);
          }
        }, this),
        error: __bind(function() {
          return console.log(arguments);
        }, this)
      });
    };
    Form.prototype.keyupName = function(event) {
      var sName;
      sName = $(event.currentTarget).val();
      this.$(".name-out").html(sName);
    };
    return Form;
  })();
  $(document).ready(function() {
    window.BB._app = new BB.Main();
    window.BB._app.bind("ready", function() {
      return Backbone.history.start();
    });
  });
}).call(this);
