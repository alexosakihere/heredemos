function return_vrp() {
    var data = JSON.stringify({
        "configuration":{
            "debug":{"performance":true}
        },
        "id": "problem_id",
        "plan": {
          "jobs": [
            {
              "id": "delivery 1",
              "places": {
                "delivery": {
                  "location": [
                    48.77636544232892,
                    9.17787627257423
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 2",
              "places": {
                "delivery": {
                  "location": [
                    48.746262493877055,
                    9.179529691385648
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 3",
              "places": {
                "delivery": {
                  "location": [
                    48.773373566154184,
                    9.131226790696292
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 4",
              "places": {
                "delivery": {
                  "location": [
                    48.75173971898186,
                    9.220397271941197
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 5",
              "places": {
                "delivery": {
                  "location": [
                    48.72122552496604,
                    9.205502896068666
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 6",
              "places": {
                "delivery": {
                  "location": [
                    48.72750933446097,
                    9.122982099813253
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 7",
              "places": {
                "delivery": {
                  "location": [
                    48.774960048927674,
                    9.204794824580352
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 8",
              "places": {
                "delivery": {
                  "location": [
                    48.78857416554568,
                    9.17085949130485
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 9",
              "places": {
                "delivery": {
                  "location": [
                    48.842190979909084,
                    9.162586909312942
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            },
            {
              "id": "delivery 10",
              "places": {
                "delivery": {
                  "location": [
                    48.83107010888645,
                    9.145902941431986
                  ],
                  "duration": 120
                }
              },
              "demand": [
                1
              ]
            }
          ]
        },
        "fleet": {
          "types": [
            {
              "id": "vehicle 1",
              "profile": "car",
              "costs": {
                "distance": 0.0002,
                "time": 0.004805555555556,
                "fixed": 22
              },
              "places": {
                "start": {
                  "time": "2019-01-01T08:00:00.000Z",
                  "location": [
                    48.83858579909084,
                    9.156373812942
                  ]
                },
                "end": {
                  "time": "2019-01-01T20:00:00.000Z",
                  "location": [
                    48.83858579909084,
                    9.156373812942
                  ]
                }
              },
              "capacity": [
                5
              ],
              "amount": 1
            },
            {
              "id": "vehicle 2",
              "profile": "car",
              "costs": {
                "distance": 0.0002,
                "time": 0.004805555555556,
                "fixed": 33
              },
              "places": {
                "start": {
                  "time": "2019-01-01T08:00:00.000Z",
                  "location": [
                    48.83858579909084,
                    9.156373812942
                  ]
                },
                "end": {
                  "time": "2019-01-01T20:00:00.000Z",
                  "location": [
                    48.83858579909084,
                    9.156373812942
                  ]
                }
              },
              "capacity": [
                5
              ],
              "amount": 1
            }
          ]
        }
      });

      console.log(data);
      
      var xhr = new XMLHttpRequest();
      //xhr.withCredentials = true;
      
      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
          console.log(this.responseText);
        }
      });
      
      xhr.open("POST", "https://vrp.cit.api.here.com/v1/problems");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", "bearer eyJhbGciOiJSUzUxMiIsImN0eSI6IkpXVCIsImlzcyI6IkhFUkUiLCJhaWQiOiJPSDVLaTBWallzZFYwQ0YwMDZvSyIsImlhdCI6MTU2MzI4ODMwNSwiZXhwIjoxNTYzMzc0NzA1LCJraWQiOiJqMSJ9.ZXlKaGJHY2lPaUprYVhJaUxDSmxibU1pT2lKQk1qVTJRMEpETFVoVE5URXlJbjAuLlhISi1aLUtndDI0SjMxYVp3TnFad3cuREItZnQ2TEJ4Z2E0MjFhSGkwSC1SVV9PZ2xOdnVCUEdzTFppS1N5TV9hOWlxbzN2TUJkSUFYYkVkX3MyZlRxeFFSVTNfSWlsdTd1LUp1RFBYZDE2MlVUbDAyR2JBLUFPck4wVW43elQ0S0hiX0FScjhqV2UzVldqbUwzTjBleWEuX0ZwM2FtaU1QOVg5dDhJMUdxYkhycWNLUTdvUndBSXZFaVNBZU9Fb0hBUQ.TpWKs_RXpv7I51Uws7FKpNwxrhmVfr6LsGqocsKCmbLdkHhHSGKeyyw95LO_1LzIz1-j9dlo6gj210uO_EJuFIZrBt8pcFgnH1ts3g-6D8dZ3bQvipO4jyGNGkGTzG5EIMyoQf3ynRrNW9FYIZqKfhkbV5XCWnppANqSja65MPMHposbppPB13Cteagcrp5Py5DwWBpBnsK1oaFNZCF0__fo0FNUsvuNQAmBrDqRkDol_ubmLYK7ZviVXLwH4CyDySpAuj_Lh5SrBaomjXmyDZQPXAVb1ZLzZG4r69Rm_qUssmFwzWdmfghTj1B1A7frz1J9AzN6Hs980aQ53h8Yzw");
      xhr.setRequestHeader("Accept", "*/*");
      xhr.setRequestHeader("Host", "vrp.cit.api.here.com");
      xhr.setRequestHeader("accept-encoding", "gzip, deflate");
      //xhr.setRequestHeader("content-length", "4281");
      xhr.setRequestHeader("Connection", "keep-alive");
      
      xhr.send(data);
}

function display_vrp() {
    var vrp = {"problemId":"problem_id","statistic":{"cost":127.83090000000523,"distance":81732,"duration":11754,"times":{"driving":10554,"serving":1200,"waiting":0,"break":0}},"tours":[{"vehicleId":"vehicle 1_1","typeId":"vehicle 1","stops":[{"location":[48.83858579909084,9.156373812942],"time":{"arrival":"2019-01-01T08:00:00Z","departure":"2019-01-01T08:00:00Z"},"load":[5],"activities":[{"jobId":"departure","type":"departure"}]},{"location":[48.842190979909084,9.162586909312942],"time":{"arrival":"2019-01-01T08:03:22Z","departure":"2019-01-01T08:05:22Z"},"load":[4],"activities":[{"jobId":"delivery 9","type":"delivery"}]},{"location":[48.774960048927674,9.204794824580352],"time":{"arrival":"2019-01-01T08:28:01Z","departure":"2019-01-01T08:30:01Z"},"load":[3],"activities":[{"jobId":"delivery 7","type":"delivery"}]},{"location":[48.77636544232892,9.17787627257423],"time":{"arrival":"2019-01-01T08:37:53Z","departure":"2019-01-01T08:39:53Z"},"load":[2],"activities":[{"jobId":"delivery 1","type":"delivery"}]},{"location":[48.78857416554568,9.17085949130485],"time":{"arrival":"2019-01-01T08:50:17Z","departure":"2019-01-01T08:52:17Z"},"load":[1],"activities":[{"jobId":"delivery 8","type":"delivery"}]},{"location":[48.83107010888645,9.145902941431986],"time":{"arrival":"2019-01-01T09:12:21Z","departure":"2019-01-01T09:14:21Z"},"load":[0],"activities":[{"jobId":"delivery 10","type":"delivery"}]},{"location":[48.83858579909084,9.156373812942],"time":{"arrival":"2019-01-01T09:20:34Z","departure":"2019-01-01T09:20:34Z"},"load":[0],"activities":[{"jobId":"arrival","type":"arrival"}]}],"statistic":{"cost":51.122855555557706,"distance":29464,"duration":4834,"times":{"driving":4234,"serving":600,"waiting":0,"break":0}}},{"vehicleId":"vehicle 2_1","typeId":"vehicle 2","stops":[{"location":[48.83858579909084,9.156373812942],"time":{"arrival":"2019-01-01T08:00:00Z","departure":"2019-01-01T08:00:00Z"},"load":[5],"activities":[{"jobId":"departure","type":"departure"}]},{"location":[48.746262493877055,9.179529691385648],"time":{"arrival":"2019-01-01T08:27:10Z","departure":"2019-01-01T08:29:10Z"},"load":[4],"activities":[{"jobId":"delivery 2","type":"delivery"}]},{"location":[48.75173971898186,9.220397271941197],"time":{"arrival":"2019-01-01T08:40:06Z","departure":"2019-01-01T08:42:06Z"},"load":[3],"activities":[{"jobId":"delivery 4","type":"delivery"}]},{"location":[48.72122552496604,9.205502896068666],"time":{"arrival":"2019-01-01T08:55:07Z","departure":"2019-01-01T08:57:07Z"},"load":[2],"activities":[{"jobId":"delivery 5","type":"delivery"}]},{"location":[48.72750933446097,9.122982099813253],"time":{"arrival":"2019-01-01T09:16:03Z","departure":"2019-01-01T09:18:03Z"},"load":[1],"activities":[{"jobId":"delivery 6","type":"delivery"}]},{"location":[48.773373566154184,9.131226790696292],"time":{"arrival":"2019-01-01T09:31:21Z","departure":"2019-01-01T09:33:21Z"},"load":[0],"activities":[{"jobId":"delivery 3","type":"delivery"}]},{"location":[48.83858579909084,9.156373812942],"time":{"arrival":"2019-01-01T09:55:20Z","departure":"2019-01-01T09:55:20Z"},"load":[0],"activities":[{"jobId":"arrival","type":"arrival"}]}],"statistic":{"cost":76.70804444444752,"distance":52268,"duration":6920,"times":{"driving":6320,"serving":600,"waiting":0,"break":0}}}]}
    console.log(vrp.tours);
}