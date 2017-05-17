var Issue = can.DefineMap.extend({
  seal: false
}, {
  id: 'number',
  title: 'string',
  sort_position: 'number',
  body: 'string'
});

Issue.List = can.DefineList.extend({
  '#': Issue
});

Issue.algebra = new can.set.Algebra(
  can.set.props.id('id'),
  can.set.props.sort('sort')
);

Issue.connection = can.connect.superMap({
  url: '/api/github/repos/chasenlehara/webhook-test/issues',// TODO: this will be updated to canjs/github-issues-example
  Map: Issue,
  List: Issue.List,
  name: 'issue',
  algebra: Issue.algebra
});

var socket = io();
socket.on('issue created', function(issue) {
  Issue.connection.createInstance(issue);
});
socket.on('issue updated', function(issue) {
  Issue.connection.updateInstance(issue);
});
socket.on('issue removed', function(issue) {
  Issue.connection.destroyInstance(issue);
});

can.view.callbacks.attr('sortable', function(element) {
  $(element).sortable({
    containment: 'parent',
    handle: '.grab-handle',
    revert: true,
    start: function(event, ui) {
      var draggedElement = ui.item;
      draggedElement.addClass('drag-background');
    },
    stop: function(event, ui) {
      var draggedElement = ui.item;
      draggedElement.removeClass('drag-background');
    },
    update: function(event, ui) {
      var draggedElement = ui.item[0];
      var draggedIssue = (can.data.get.call(draggedElement, 'issue'))();
      var nextSibling = draggedElement.nextElementSibling;
      var previousSibling = draggedElement.previousElementSibling;
      var nextIssue = (nextSibling) ? (can.data.get.call(nextSibling, 'issue'))() : {sort_position: Number.MAX_SAFE_INTEGER};
      var previousIssue = (previousSibling) ? (can.data.get.call(previousSibling, 'issue'))() : {sort_position: Number.MIN_SAFE_INTEGER};
      draggedIssue.sort_position = (nextIssue.sort_position + previousIssue.sort_position) / 2;
      draggedIssue.save();
    }
  });
});

var GitHubIssuesVM = can.DefineMap.extend({
  issuesPromise: {
      value: function(){
          return Issue.getList({
            sort: 'sort_position'
          });
      }
  },
  title: 'string',
  body: 'string',
  send: function(event, issues) {
    event.preventDefault();
    var firstIssue = (issues) ? issues[0] : null;
    var sortPosition = (firstIssue) ? (Number.MIN_SAFE_INTEGER + firstIssue.sort_position) / 2 : 0;

    new Issue({
        title: this.title,
        body: this.body,
        sort_position: sortPosition
    }).save().then(function(){
        this.title = this.body = '';
    }.bind(this));
  }
});

can.Component.extend({
  tag: 'github-issues',
  view: can.stache.from('github-issues-template'),
  ViewModel: GitHubIssuesVM
});

var AppVM = can.DefineMap.extend({
  pageTitle: {
    type: 'string',
    value: 'GitHub Issues',
  }
});

var appVM = new AppVM();
var template = can.stache.from('github-template');
var frag = template(appVM);
document.body.appendChild(frag);
