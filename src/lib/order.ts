import { prisma } from "@/lib/prisma";

export async function getAvailableSkins() {
  // Find skins that have at least one unused slot
  // Also filter out future release dates (unless that's handled by 'upcoming')
  const skins = await prisma.skin.findMany({
    where: {
      isActive: true,
      releaseDate: { lte: new Date() }, // Only released skins
      slots: {
        some: {
          isUsed: false,
        },
      },
    },
    include: {
      _count: {
        select: { slots: { where: { isUsed: false } } },
      },
    },
    orderBy: { releaseDate: 'desc' },
  });
  return skins;
}

export async function getUpcomingSkins() {
  const skins = await prisma.skin.findMany({
    where: {
      isActive: true,
      releaseDate: { gt: new Date() }, // Future release dates
    },
    orderBy: { releaseDate: 'asc' },
  });
  return skins;
}

export async function createOrder(data: {
  skinId: string;
  email: string;
  name: string;
  buyerIGN: string;
  buyerMLID: string;
  buyerServer: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Bot Detection / Rate Limiting
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrders = await tx.order.count({
        where: {
            OR: [
                { buyerMLID: data.buyerMLID },
                { buyer: { email: data.email } }
            ],
            createdAt: { gte: fiveMinutesAgo }
        }
    });

    if (recentOrders >= 3) {
        throw new Error("Too many recent orders. Please try again later.");
    }

    // Check if MLBB ID is banned (associated with any banned user)
    const bannedUserWithSameID = await tx.user.findFirst({
        where: {
            isBanned: true,
            orders: {
                some: {
                    buyerMLID: data.buyerMLID,
                    buyerServer: data.buyerServer
                }
            }
        }
    });

    if (bannedUserWithSameID) {
        throw new Error(`This MLBB Account (${data.buyerMLID} ${data.buyerServer}) is banned.`);
    }

    // 2. Find or create the buyer
    let buyer = await tx.user.findUnique({
      where: { email: data.email },
    });

    if (buyer && buyer.isBanned) {
        throw new Error(`User is banned. Reason: ${buyer.banReason || 'No reason provided'}`);
    }

    if (!buyer) {
      buyer = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: "BUYER",
        },
      });
    }

    // 2. Create the order
    const order = await tx.order.create({
      data: {
        buyerId: buyer.id,
        skinId: data.skinId,
        buyerIGN: data.buyerIGN,
        buyerMLID: data.buyerMLID,
        buyerServer: data.buyerServer,
        status: "PENDING",
      },
    });

    // 3. Automatic assignment disabled per request.
    // Admin must manually assign gifter.

    return order;
  });
}

export async function getOrder(orderId: string) {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: { skin: true, buyer: true }
    });
}

export async function assignGifter(orderId: string, targetGifterId?: string) {
    // Manually assign a gifter if one wasn't assigned automatically
    // This looks for an available slot
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    return prisma.$transaction(async (tx) => {
        // 1. If already assigned, release the old slot
        if (order.gifterId) {
             // Find a used slot for the old gifter and skin
             const oldSlot = await tx.gifterSlot.findFirst({
                 where: {
                     gifterId: order.gifterId,
                     skinId: order.skinId,
                     isUsed: true
                 }
             });
             
             // If we found a slot, free it. If not, maybe it was deleted or inconsistent, but we proceed.
             if (oldSlot) {
                 await tx.gifterSlot.update({
                     where: { id: oldSlot.id },
                     data: { isUsed: false }
                 });
             }
        }

        // 2. Find a new slot
        let newSlot;
        if (targetGifterId) {
            newSlot = await tx.gifterSlot.findFirst({
                where: {
                    skinId: order.skinId,
                    gifterId: targetGifterId,
                    isUsed: false
                }
            });
             if (!newSlot) throw new Error("Selected gifter has no available slots for this skin");
        } else {
            // Find any available slot
            newSlot = await tx.gifterSlot.findFirst({
                where: {
                    skinId: order.skinId,
                    isUsed: false
                }
            });
            if (!newSlot) throw new Error("No slots available from any gifter");
        }

        // 3. Mark new slot used
        await tx.gifterSlot.update({
            where: { id: newSlot.id },
            data: { isUsed: true }
        });

        // 4. Update order
        return tx.order.update({
            where: { id: orderId },
            data: { 
                gifterId: newSlot.gifterId,
                status: 'ASSIGNED'
            }
        });
    });
}

export async function markFollowed(orderId: string) {
    return prisma.order.update({
        where: { id: orderId },
        data: {
            status: 'FOLLOWED',
            followedAt: new Date(),
            // Set readyAt to 7 days from now (approx 8 days to be safe per request, user said 8 days cooldown)
            // Or 7 days is standard. Let's do 7 days as typically requested in MLBB gifting logic.
            // If user said 8 days specifically: "create cron job that check 8 days cooldown"
            // Let's set it to 8 days from now.
            readyAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) 
        }
    });
}

export async function autoMarkReady() {
    // This is called by cron job
    const now = new Date();
    return prisma.order.updateMany({
        where: {
            status: 'FOLLOWED',
            readyAt: { lte: now }
        },
        data: {
            status: 'READY_FOR_GIFTING'
        }
    });
}

export async function getGifterOrders(gifterId: string) {
  return prisma.order.findMany({
    where: { gifterId },
    include: { skin: true, buyer: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllOrders() {
  return prisma.order.findMany({
    include: { skin: true, buyer: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markSent(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { 
        status: 'SENT',
        sentAt: new Date()
    },
  });
}

// Admin function to add slots
export async function addGifterSlot(skinId: string, gifterId: string, quantity: number = 1) {
    const slots = [];
    for (let i = 0; i < quantity; i++) {
        slots.push({
            skinId,
            gifterId,
            isUsed: false,
        });
    }
    return prisma.gifterSlot.createMany({
        data: slots,
    });
}

export async function getAllSkins() {
    return prisma.skin.findMany({
        include: {
            _count: {
                select: { slots: { where: { isUsed: false } } }
            }
        }
    })
}

export async function getSkinsWithGifterSlots(gifterId: string) {
    return prisma.skin.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: { 
                    slots: { 
                        where: { 
                            isUsed: false,
                            gifterId: gifterId
                        } 
                    } 
                }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export async function getAllGifters() {
    return prisma.user.findMany({
        where: { role: 'GIFTER' },
        select: { id: true, name: true, email: true }
    });
}

export async function createSkin(data: { name: string; price: number; imageUrl?: string; displayPrice?: string; description?: string }) {
    return prisma.skin.create({
        data: {
            name: data.name,
            price: data.price,
            imageUrl: data.imageUrl,
            displayPrice: data.displayPrice,
            description: data.description,
            isActive: true,
        }
    });
}

export async function updateSkin(id: string, data: { name?: string; price?: number; imageUrl?: string; displayPrice?: string; description?: string; isActive?: boolean }) {
    return prisma.skin.update({
        where: { id },
        data
    });
}

export async function getUnusedSlots() {
    return prisma.gifterSlot.findMany({
        where: { isUsed: false },
        include: {
            skin: true,
            gifter: {
                select: { id: true, name: true, email: true }
            }
        }
    });
}

export async function refundOrder(orderId: string) {
    return prisma.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' }
    });
}

export async function invalidOrder(orderId: string) {
    return prisma.order.update({
        where: { id: orderId },
        data: { status: 'INVALID' }
    });
}

export async function deleteOrder(orderId: string) {
    return prisma.order.delete({
        where: { id: orderId }
    });
}

export async function banUser(userId: string, reason: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { 
            isBanned: true,
            banReason: reason
        }
    });
}

export async function unbanUser(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { 
            isBanned: false,
            banReason: null
        }
    });
}

export async function getBannedUsers() {
    return prisma.user.findMany({
        where: { isBanned: true },
        orderBy: { createdAt: 'desc' }
    });
}
