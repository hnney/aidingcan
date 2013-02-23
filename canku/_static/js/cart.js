/**
 * 购物车功能
 * User: willerce
 * Date: 9/18/12
 * Time: 12:56 PM
 */

(function(){

  $(window).scroll(function () {
    var top = $(this).scrollTop();
    var top = 66 - top;
    if(top<0) top = 0;
    $('.order').css('top',top+"px");
  });

  var storage = window.localStorage;
  var shop_id = $('#shop_id').val();
  var shop_name = $('#shop_name').val();

  //购物车对象
  //从localstorage中取出已经点的美食
  var shopping_cart = [];
  if(storage.getItem(shop_id)!=null){
    shopping_cart = JSON.parse(storage.getItem(shop_id));
  }

  //遍历美食列表
  for(var i in shopping_cart){
    $('#food-'+shopping_cart[i].id).addClass('checked');

    //创建购物篮
    var dom  = $(create_car_item(shopping_cart[i]));
    dom.find('select').val(shopping_cart[i].num);
    dom.appendTo($('.order .order-item'));
  }

  //计算总价
  var total = get_total();
  $(".total em").text(total.price);
  $(".sum em").text(total.num);

  //绑定份数修改事件
  $('.cart_o_num').change(changeNum);
  $('.del_btn').click(del_food);
  $('empty').click(empty);


  $('.food-item').click(function(){
    var el = $(this);
    if(el.hasClass('checked')){//已经选中-> 取消
      el.removeClass('checked');
      for(var i in shopping_cart){
        if(shopping_cart[i].id==el.attr('data-id')){
          $('#car-'+shopping_cart[i].id).remove();
          shopping_cart.splice(i, 1);
          //重设购物车
          storage.setItem(shop_id, JSON.stringify(shopping_cart));
        }
      }
    }else{//未选中
      el.addClass('checked');
      //构建对象
      var food = {
        id: el.attr('data-id'),
        name: el.attr('data-name'),
        price: el.attr('data-price'),
        num : 1
      };
      //向数组添加
      shopping_cart.push(food);
      //向storage中保存
      storage.setItem(shop_id, JSON.stringify(shopping_cart));
      //向购物篮添加
      $(create_car_item(food)).appendTo($('.order .order-item'));
      //绑定份数修改事件
      $('.cart_o_num').change(changeNum);
      $('.del_btn').click(del_food);
    }

    //重新计算
    var total = get_total();
    $(".total em").text(total.price);
    $(".sum em").text(total.num);
  });

  $('.pay-btn a').click(function(e){
    $('#car-confirm').reveal({
      animation: 'fadeAndPop',
      animationspeed: 300,
      closeonbackgroundclick: false,
      dismissmodalclass: 'close-reveal-modal'
    });

    if(shopping_cart.length<=0){
      $('#confirm-list').empty().html("亲，不要着急，您还木有点菜呢！");
    }else{

      var dom = '<table width="100%">';

      for(var key in shopping_cart){
        dom += '<td><td>'+shopping_cart[key].name+'<em class="price">'+shopping_cart[key].price+'元</em></td><td>'+shopping_cart[key].num+'份</td></tr>'
      }

      dom += '</table><div class="foot"><span class="total">共：'+get_total().price+' 元</span><button type="button" id="buy-go" class="btn">提交订单</button></div>';

      $('#confirm-list').empty().html(dom);

      $('#buy-go').unbind('click').bind('click',function(){
        //向后台提交订单
        $.ajax({
          type: "POST",
          url: "/shop/submit_order",
          data: "list="+JSON.stringify(shopping_cart)+"&shop_name="+shop_name+"&shop_id="+shop_id,
          dataType: 'json',
          success: function(data){
            if(data.result=="success"){
              //清空localstorage
              storage.removeItem(shop_id);
              $('#confirm-list').empty().html('<div style="text-align:center;"><p>订单提交成功，你的运气值：'+data.luck+'点</p><p>倒计时 <span class="timeout">6</span> 秒后 <a href="/today">跳转到今日订单</a></p></div>');

              var totaltime = 0;

              setInterval(function(){
                if(totaltime<5){
                  totaltime++;
                  $('#confirm-list .timeout').text(parseInt($('#confirm-list .timeout').text())-1);
                }else{
                  location.href = "/today";
                }
              }, 1000)

            }
          },
          error: function(){
            alert('下单出错了');
          }
        });
      });

    }
  });

  function create_car_item(food){
    return '<ul id="car-'+food.id+'" data-id="'+food.id+'">'+
          '<li class="side_order_name">'+food.name+'</li>'+
          '<li class="side_order_sum clearfix"><select class="cart_o_num">'+
        '<option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>'+
        '<option value="5">5</option><option value="6">6</option><option value="7">7</option><optionvalue="8">8</option></select></li>'+
          '<li class="side_order_total"><em>'+food.price+'</em>元</li>'+
          '<li class="side_order_delete"><a id="cart_del_'+food.id+'" class="del_btn" href="javascript:void(0);" title="不要"></a></li>'+
      '</ul>';
  }


  function get_total(){
    var price = 0.0;
    var num = 0;
    for(var i in shopping_cart){
      price += (parseFloat(shopping_cart[i].price) * parseInt(shopping_cart[i].num));
      num += parseInt(shopping_cart[i].num);
    }
    return {price: price, num : num};
  }

  function changeNum(){
    var food_id = $(this).parents('ul').attr('data-id');

    for(var i in shopping_cart){
      if(shopping_cart[i].id==food_id){
        shopping_cart[i].num = $(this).val();
        //重设购物车
        storage.setItem(shop_id, JSON.stringify(shopping_cart));
        //重新计算
        var total = get_total();
        $(".total em").text(total.price);
        $(".sum em").text(total.num);
      }
    }
  };

  function del_food(){
    var food_id = $(this).parents('ul').attr('data-id');
    for(var i in shopping_cart){
      if(shopping_cart[i].id==food_id){
        shopping_cart.splice(i, 1);
        //重设购物车
        storage.setItem(shop_id, JSON.stringify(shopping_cart));
        $(this).parents('ul').remove();
        $('#food-'+food_id).removeClass('checked');
        //重新计算
          var total = get_total();
          $(".total em").text(total.price);
          $(".sum em").text(total.num);
      }
    }
  }

  function empty(){
    $('.order-item .side_order_delete').trigger('click');
  }

})();

