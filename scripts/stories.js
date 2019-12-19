/*
    "car2":{
        "name":"Streamlining outbound logistics",
        "desc":"HERE Tracking provides greater insight into the supply chain, saving time, money and resources when schedule changing provides new opportunities.",
        "savings":6100,
        "tracker":"car6",
        "time":96,
        "zoom":15,
        "step":0,
        "context":"delay",
        "sequence":[
            {
                "title":"Scheduled delivery",
                "alert":["tracker","normal"],
                "center":"tracker",
                "time":96,
                "zoom":15,
                "text":["This car is scheduled for delivery later than the other cars on the ship. It's offloaded later, to account for the decreased urgency of getting it through customs."]
            },
            {
                "title":"Faster than expected clearance",
                "center":"tracker",
                "alert":["tracker","normal"],
                "time":83,
                "zoom":15,
                "autoplay":10,
                "text":["However, handling the necessary paperwork goes faster than expected. The dealership in Philadelphia is receiving other cars on this shipment, and a car transport has already been scheduled."]
            },
            {
                "title":"Cost savings opportunity",
                "center":"tracker",
                "alert":["tracker","correction"],
                "time":73,
                "zoom":15,
                "autoplay":10,
                "text":["The dealership calls their customer, who confirms that they can pick up the car a day early. The car can now be placed on the existing transport."]
            },
            {
                "title":"Cost savings opportunity",
                "center":[39.25031,-76.52552],
                "alert":["tracker","correction"],
                "time":49,
                "zoom":15,
                "autoplay":3,
                "text":["The car will now be delivered ahead of schedule, taking advantage of existing transport capacity. By using HERE Tracking to plan ahead, the dealer improves customer experience."]
            },
            {
                "title":"Cost savings opportunity",
                "center":"tracker",
                "alert":["tracker","correction"],
                "time":46,
                "zoom":7,
                "autoplay":6,
                "text":["HERE Tracking has removed the need for a special car carrier, saved the cost in parking and storage, and improved the utilization of the logistics chain.@@Savings using HERE: #$6,100"]
            }
        ]
    },
*/

stories = {
    "car1":{
        "name":"Detecting misplacement",
        "desc":"When valuable goods aren't where they're supposed to be, there can be substantial cost implications. HERE Tracking allows for quick responses to exceptions.",
        "savings":3500,
        "tracker":"car4",
        "time":101,
        "zoom":15,
        "step":0,
        "context":"delay",
        "sequence":[
            {
                "title":"Offloading",
                "alert":["tracker","normal"],
                "center":"tracker",
                "time":101,
                "zoom":15,
                "text":["This container is being offloaded. A forklift is tasked to put the container in the right place."]
            },
            {
                "title":"Offloading",
                "center":[39.24339,-76.5327],
                "alert":["tracker","normal"],
                "time":101,
                "zoom":15,
                "autoplay":2,
                "text":["Containers batched for customs processing and delivery are all being stored in the same staging area. The dispatch manager is notified when containers enter their assigned area."]
            },
            {
                "title":"Misplacement",
                "alert":["tracker","alert"],
                "center":"tracker",
                "time":98,
                "zoom":15,
                "text":["Due to a miscommunication, the container is routed to a different staging area."]
            },
            {
                "title":"Predicted delays",
                "alert":["tracker","alert"],
                "center":"tracker",
                "time":98,
                "autoplay":5,
                "zoom":15,
                "text":["With the container not where it's supposed to be, the delay time begins to rise."]
            },
            {
                "title":"Misplacement costs",
                "alert":["tracker","alert"],
                "time":93,
                "zoom":15,
                "text":["This misplacement has substantial consequences. Additional work will be required to locate the container. It might even miss the transport scheduled to take it to its next checkpoint.@@Potential loss: *$3,500"]
            },
            {
                "title":"Alert raised",
                "alert":["tracker","correction"],
                "time":92,
                "zoom":15,
                "text":["HERE Tracking allows the container to be precisely located using the tracker's built-in positioning systems. The exception can now be easily managed."]
            },
            {
                "title":"Problem corrected",
                "alert":["tracker","normal"],
                "time":92,
                "autoplay":6,
                "zoom":15,
                "text":["The container is moved to its proper location, and the delay vanishes. HERE Tracking means that the shipment reaches its destination on time.@@Cost averted: #$3,500"]
            }
        ]
    },
    "pharma":{
        "name":"Cold-chain logistics",
        "desc":"Maintaining proper temperatures through the supply chain is critical in pharmaceutical logistics. HERE Tracking allows for quick reaction when something goes wrong.",
        "savings":150000,
        "tracker":"pharma1",
        "time":60,
        "zoom":14,
        "step":0,
        "context":"temperature",
        "sequence":[
            {
                "title":"Cold-chain logistics",
                "alert":["tracker","normal"],
                "center":"tracker",
                "time":60,
                "zoom":14,
                "text":["This is a refrigerated container carrying medical supplies that need to stay below a particular temperature. Temperature excursions cost the pharmaceutical industry #$16 billion every year^."]
            },
            {
                "title":"Cold-chain logistics",
                "alert":false,
                "time":59,
                "zoom":14,
                "text":["An equipment malfunction has compromised down the container's refrigeration unit. The temperature begins to increase."]
            },
            {
                "title":"Temperature excursion detected",
                "alert":["tracker","alert"],
                "time":58,
                "zoom":14,
                "text":["If temperatures continue to rise, the cargo could become damaged or unsalable. @@Potential loss: *$1,250,000"]
            },
            {
                "title":"Excursion alert",
                "alert":["tracker","alert"],
                "time":57,
                "zoom":14,
                "text":["Before the situation becomes critical, an alert is raised summarizing the situation."]
            },
            {
                "title":"Excursion alert",
                "alert":["tracker","alert"],
                "time":57,
                "zoom":16,
                "text":["Thanks to HERE Tracking, the container can be accurately and precisely located."]
            },
            {
                "title":"Excursion alert",
                "alert":["tracker","correction"],
                "time":56,
                "zoom":16,
                "text":["A repair team has been dispatched and can correct the malfunction in a timely manner."]
            },
            {
                "title":"Excursion corrected",
                "alert":["tracker","correction"],
                "time":55,
                "zoom":16,
                "autoplay":6,
                "text":["Temperatures begin to drop again."]
            },
            {
                "title":"Excursion corrected",
                "alert":["tracker","normal"],
                "time":48,
                "zoom":16,
                "text":["By combining telemetry (temperature data) with location, HERE Tracking ensures that the container's cargo remains in good condition and safe to use. @@Cost averted: #$1,250,000^"]
            }
        ]
    },
    "pharma2":{
        "name":"ETA adjustment",
        "desc":"Unexpected delays or changing conditions create cascading effects through the supply chain. HERE Tracking, combined with HERE location services, smooths out any exceptions.",
        "savings":150000,
        "tracker":"pharma3",
        "time":87,
        "zoom":12,
        "step":0,
        "context":"delay",
        "sequence":[
            {
                "title":"ETA prediction",
                "alert":["tracker","normal"],
                "center":"tracker",
                "time":87,
                "zoom":12,
                "text":["Due to weather conditions en-route, this shipment has arrived late at the port of entry. The delay is noted, and a new ETA has been reported."]
            },
            {
                "title":"Delay monitoring",
                "alert":false,
                "time":85,
                "zoom":12,
                "autoplay":7,
                "text":["Paperwork processing has taken much less time than originally predicted. The expected delay begins to drop."]
            },
            {
                "title":"Delay monitoring",
                "alert":false,
                "time":73,
                "zoom":7,
                "autoplay":7,
                "text":["As a result, the shipment leaves the port of entry earlier than anticipated. It continues to make good progress on its way to a transfer lot."]
            },
            {
                "title":"No transport available",
                "alert":["tracker","alert"],
                "center":"tracker",
                "time":66,
                "zoom":7,
                "text":["Because it's early, the scheduled transport won't be ready. The shipment will now have to wait at a depot until the scheduled transport arrives, wasting time and money."]
            },
            {
                "title":"Efficient alternatives",
                "alert":["tracker","correction"],
                "time":66,
                "zoom":7,
                "text":["Predictive, regularly updated ETAs from HERE Tracking means this situation is identified and addressed ahead of time, and new transportation can be made available."]
            },
            {
                "title":"Efficient alternatives",
                "alert":["tracker","correction"],
                "time":65,
                "zoom":7,
                "autoplay":7,
                "text":["The shipment continues on its way without interruption."]
            },
            {
                "title":"Efficient alternatives",
                "alert":["tracker","normal"],
                "center":"tracker",
                "time":58,
                "zoom":7,
                "text":["By the time it arrives, a courier is available to take the shipment to its final destination. It arrives on time, with accurate monitoring keeping all relevant parties informed."]
            }
        ]
    }
};