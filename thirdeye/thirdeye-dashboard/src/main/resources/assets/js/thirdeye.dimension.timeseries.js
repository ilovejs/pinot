$(document).ready(function() {
    var containers = {}
    var aggregateMillis = toMillis($("#sidenav-aggregate-size").val(), $("#sidenav-aggregate-unit").val())

    $("#dimension-time-series-area").find('.dimension-time-series-placeholder').each(function(i, container) {
        var containerObj = $(container)
        var dimension = containerObj.attr('dimension')
        containers[dimension] = {
            plot: containerObj
        }
    })

    $("#dimension-time-series-area").find('.dimension-time-series-tooltip').each(function(i, container) {
        var containerObj = $(container)
        var dimension = containerObj.attr('dimension')
        containers[dimension].tooltip = containerObj
    })

    $("#dimension-time-series-area").find('.dimension-time-series-title').each(function(i, container) {
        var containerObj = $(container)
        var dimension = containerObj.attr('dimension')
        containers[dimension].title = containerObj
    })

    $("#dimension-time-series-area").find('.dimension-time-series-legend').each(function(i, container) {
        var containerObj = $(container)
        var dimension = containerObj.attr('dimension')
        containers[dimension].legend = containerObj
    })

    var hash = parseHashParameters(window.location.hash)

    var options = {
        mode: hash['dimensionTimeSeriesMode'] ? hash['dimensionTimeSeriesMode'] : 'same',
        legend: true,
        filter: function(data) {
            // Pick the top 4 according to baseline value
            data.sort(function(a, b) {
                if (!b.data[0] && !a.data[0]) {
                    return 0
                } else if (b.data[0] && !a.data[0]) {
                    return 1
                } else if (!b.data[0] && a.data[0]) {
                    return -1
                }

                return b.data[0][1] - a.data[0][1]
            })

            return data.slice(0, 4)
        },
        click: function(event, pos, item) {
            // Parse item.series.dimensions
            var seriesDimensions = JSON.parse(item.series.dimensions)

            // Parse item.series.dimensionNames
            var dimensionNames = JSON.parse(item.series.dimensionNames)

            // Parse dimensionValues from uri
            var dimensionValues = parseDimensionValues(window.location.search)

            // Set all non-star values in URI
            $.each(dimensionNames, function(i, name) {
                var value = seriesDimensions[i]
                if (value && value != "*") {
                    dimensionValues[name] = value
                }
            })

            // Change window location
            var newQuery = encodeDimensionValues(dimensionValues)
            window.location.search = newQuery
        },
        aggregateMillis: aggregateMillis
    }

    var path = parsePath(window.location.pathname)
    if (path.metricViewType == 'TIME_SERIES_OVERLAY') {
      options.windowMillis = toMillis(1, 'WEEKS'), // TODO make configurable
      options.windowOffsetMillis = toMillis($("#sidenav-aggregate-size").val(), $("#sidenav-aggregate-unit").val())
    }

    function plotAllSeries() {
        $.each(containers, function(dimension, container) {
            var optionsCopy = $.extend(true, {}, options)
            container.title.html(dimension)
            optionsCopy.dimension = dimension
            optionsCopy.legendContainer = container.legend
            renderTimeSeries(container.plot, container.tooltip, optionsCopy)
        })
    }

    // split button
    $(".dimension-time-series-button-mode").click(function(event) {
        var obj = $(this)

        var mode = null
        if (obj.hasClass('uk-active')) {
            mode = 'same'
            obj.removeClass('uk-active')
        } else {
            mode = 'own'
            obj.addClass('uk-active')
        }

        var hash = parseHashParameters(window.location.hash)
        hash['dimensionTimeSeriesMode'] = mode
        window.location.hash = encodeHashParameters(hash)

        options.mode = mode
        plotAllSeries()

        return false
    })

    plotAllSeries()
})
