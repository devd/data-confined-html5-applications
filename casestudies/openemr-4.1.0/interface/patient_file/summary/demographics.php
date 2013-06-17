<?php require('../../globals.php'); ?>
<html>
<body>
<style>
iframe,body,html{ width:100%;margin:0;border:0;padding:0;}
 </style>
<script src="master.js" type="text/javascript"></script>
<script type="text/javascript">
(function () {
  setupSandbox({
    url: 'demographics_internal.php' + window.location.search,
    base: document.baseURI,
    pid: <?php echo $_SESSION['pid'] ? (int) $_SESSION['pid'] : 'null'; ?>,
    web_root: unescape('<?php echo urlencode($web_root); ?>')
  });

  //Visolve - sync the radio buttons - Start
  if((top.window.parent) && (parent.window)){
    var wname = top.window.parent.left_nav;
    wname.syncRadios();
    wname.setRadio(parent.window.name, "dem");
  }
})();
</script>
</body>
