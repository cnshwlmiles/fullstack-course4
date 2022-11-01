function finalizeFrontEndLogin(response) {
    // TODO: 處理登入成功後的流程
    // 取得idToken
    // https://firebase.google.com/docs/reference/js/firebase.User#getidtoken

}

// 登入表單送出時
$('#loginForm').submit(function (event) {
    event.preventDefault();
    const email = $('#loginEmail').val(),
        password = $('#loginPassword').val();
    console.log('[開始登入]', { email: email, password: password });
    // TODO: 處理登入流程
    // https://firebase.google.com/docs/auth/web/start#sign_in_existing_users
    // firebase
    //     .auth()
    //     .signInWithEmailAndPassword(email, password)
    //     .then(function (response) {
    //         console.log('[登入成功]', response);
    //         finalizeFrontEndLogin(response)
    //     })
    //     .catch(function (error) {
    //         console.log('[登入失敗]', error);
    //         alert('登入失敗');
    //     });
});

// 註冊表單送出時
$('#signUpForm').submit(function (event) {
    event.preventDefault();
    const email = $('#signUpEmail').val(),
        password = $('#signUpPassword').val();
    console.log('[開始註冊]', { email: email, password: password });
    // TODO: 處理註冊流程
    // https://firebase.google.com/docs/auth/web/start#sign_up_new_users
    // firebase
    //     .auth()
    //     .createUserWithEmailAndPassword(email, password)
    //     .then(function (response) {
    //         console.log('[註冊成功]', response);
    //         finalizeFrontEndLogin(response)
    //     })
    //     .catch(function (error) {
    //         console.log('[註冊失敗]', error);
    //         alert('註冊失敗');
    //     });
});

// 登出按鈕點擊時
$('#logoutBtn').click(function () {
    console.log('[開始登出]');
    // TODO: 處理登出流程
    // https://firebase.google.com/docs/reference/js/firebase.auth.Auth#signout
    // firebase
    //     .auth()
    //     .signOut()
    //     .then(function () {
    //         console.log('[登出成功]');
    //         axios.post('/api/logout', {})
    //             .then(function () {
    //                 window.location = '/'
    //             })
    //             .catch(function () {
    //                 window.location = '/'
    //             });
    //     })
    //     .catch(function (error) {
    //         console.log('[登出失敗]', error);
    //         window.location = '/'
    //     });
});

// 可能會死掉不能用
Highcharts.chart('container', {

    title: {
      text: 'U.S Solar Employment Growth by Job Category, 2010-2020'
    },
  
    subtitle: {
      text: 'Source: <a href="https://irecusa.org/programs/solar-jobs-census/" target="_blank">IREC</a>'
    },
  
    yAxis: {
      title: {
        text: 'Number of Employees'
      }
    },
  
    xAxis: {
      accessibility: {
        rangeDescription: 'Range: 2010 to 2020'
      }
    },
  
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
  
    plotOptions: {
      series: {
        label: {
          connectorAllowed: false
        },
        pointStart: 2010
      }
    },
  
    series: [{
      name: 'Installation & Developers',
      data: [43934, 48656, 65165, 81827, 112143, 142383,
        171533, 165174, 155157, 161454, 154610]
    }, {
      name: 'Manufacturing',
      data: [24916, 37941, 29742, 29851, 32490, 30282,
        38121, 36885, 33726, 34243, 31050]
    }, {
      name: 'Sales & Distribution',
      data: [11744, 30000, 16005, 19771, 20185, 24377,
        32147, 30912, 29243, 29213, 25663]
    }, {
      name: 'Operations & Maintenance',
      data: [null, null, null, null, null, null, null,
        null, 11164, 11218, 10077]
    }, {
      name: 'Other',
      data: [21908, 5548, 8105, 11248, 8989, 11816, 18274,
        17300, 13053, 11906, 10073]
    }],
  
    responsive: {
      rules: [{
        condition: {
          maxWidth: 500
        },
        chartOptions: {
          legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
          }
        }
      }]
    }
  
  });