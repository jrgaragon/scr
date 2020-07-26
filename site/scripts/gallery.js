var app = new Vue({
  el: "#gallery",
  data: {
    galleries: [],
    imageId: "",
    alerts: {
      success: {
        message: "",
        show: false,
      },
      error: {
        message: "",
        show: false,
      },
    },
  },
  mounted() {
    let uri = window.location.search.substring(1);
    let params = new URLSearchParams(uri);
    this.imageId = params.get("id");
    console.log(params.get("id"));

    axios
      .get(`http://localhost:3000/petite/galleries/${this.imageId}`)
      .then(response => {
        this.galleries = response.data;
      })
      .catch(e => console.log(e));
  },
  methods: {
    selectMainImageAsFavorite: function (imageId) {
      let vm = this;
      axios
        .post(`http://localhost:3000/petite/admin/setMainImage/${imageId}`)
        .then(response => {
          vm.processResponseMesage(response);
        })
        .catch(e => {
          console.log(JSON.stringify(e));
          vm.processResponseMesage(response);
        });
    },
    selectSubImageAsFavorite: function (imageId) {
      let vm = this;
      axios
        .post(`http://localhost:3000/petite/admin/setSubImage/${imageId}`)
        .then(response => vm.processResponseMesage(response))
        .catch(e => vm.processResponseMesage(e));
    },
    markAsFavorite: function (imageId) {},
    deleteImage: function (imageId) {
      let vm = this;
      if (confirm('Delete?')) {      
        axios
          .delete(`http://localhost:3000/petite/admin/delete/${imageId}`)
          .then(response => {
            let index = vm.galleries.findIndex(i => i.imageId === imageId); 
            vm.$delete(vm.galleries, index);
            vm.processResponseMesage(response);
          })
          .catch(e => vm.processResponseMesage({}, e));
      }
    },
    processResponseMesage: function (response, e) {
      let vm = this;
      console.log(response)
      if (response.data && response.data.status === "done") {
        console.log(response);
        vm.alerts.success.show = true;
        vm.alerts.success.message = `${response.data.message}`;
        setTimeout(() => {
          vm.alerts.success.show = false;
          vm.alerts.success.message = "";
        }, 5000);
      } else {
        if (e) {
          console.log(e);
        } else if (response) {
          vm.alerts.error.show = true;
          vm.alerts.error.message = `${response.data.message}`;
          setTimeout(() => {
            vm.alerts.error.show = false;
            vm.alerts.error.message = "";
          }, 10000);
        }
      }
    },
  },
});