
    new Vue({
      el: '#cheshire-dashboard',
      data: {
        colorMap: {
          babyblue: '#4eb4f9',
          babypuke: '#bcba5e',
          bubblegum: '#fbe0f4',
          chestnut: '#efe1db',
          coral: '#45f0f4',
          gold: '#faf5cf',
          limegreen: '#d9f5cc',
          mintgreen: '#d9f5cc',
          pumpkin: '#ffa039',
          sizzurp: '#dfe0fa',
          strawberry: '#fcdedf',
          thundergrey: '#828282',
          topaz: '#d1eeeb',
          violet: '#ba8aff',
        },
        contracts: {},
        kitties: [],
        users: [],
      },

      async mounted () {
        this.contracts = (await axios.get('/cheshire/contracts')).data
        this.kitties = (await axios.get('/kitties?limit=-1')).data.kitties.map((kitty) => {
          kitty.showAttrs = false
          return kitty
        })
        this.users = (await axios.get('/cheshire/users')).data.users
      },
    })
