Cache, Proxies, Queues
=========================
## Set Get
`/set` and `/get` work as setter and getter for Redis client keys.

## Recent
Recent list is maintained by the use action as it `lpush` the page and the `ltrim` so that there are max 5 pages in the recent list. /recent then uses `lrange` to print the recent pages.

## Proxy
Used `rpoplpush` to pop one of the ports from the instances list, use it and then push it back again. Proxy maintains that load is balanced hence you can see that when displaying 5 recent links, the ratio is always 3:2

### Screencast:
YouTube [Link](https://www.youtube.com/watch?v=6xAnO4xxeoE) for HW3 Sceencast.
